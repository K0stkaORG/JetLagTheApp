import { GameTime, TimelinePhase } from "@jetlag/shared-types";
import { GameSessions, and, asc, db, eq, isNull } from "~/db";

import { JoinGameDataPacket } from "@jetlag/shared-types/src/restAPI/game";
import { ExtendedError, UserRequestError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { Scheduler } from "~/lib/scheduler";
import { GameServer } from "./gameServer";

type GameSession =
	| {
			startedAt: Date;
			startedAtTime: number;
			endedAt: null;
			startGameTime: GameTime;
			endGameTime: null;
			gameTimeDuration: null;
	  }
	| {
			startedAt: Date;
			startedAtTime: number;
			endedAt: Date;
			startGameTime: GameTime;
			endGameTime: GameTime;
			gameTimeDuration: GameTime;
	  };

export class Timeline {
	protected readonly scheduler: Scheduler = new Scheduler();

	private currentSession: GameSession;

	private constructor(
		private readonly server: GameServer,
		private readonly sessions: GameSession[],
		private _phase: TimelinePhase,
	) {
		this.currentSession = this.sessions[this.sessions.length - 1];
	}

	public static async load(server: GameServer): Promise<Timeline> {
		const sessions = await db.query.GameSessions.findMany({
			where: eq(GameSessions.gameId, server.game.id),
			columns: {
				startedAt: true,
				gameTimeDuration: true,
			},
			orderBy: asc(GameSessions.startedAt),
		});

		if (sessions.length === 0)
			throw new ExtendedError(`Failed to load Timeline. No sessions found.`, {
				service: "gameServer",
				gameServer: server,
			});

		if (sessions[0].startedAt > new Date()) {
			if (sessions.length > 1)
				throw new ExtendedError(
					`Failed to load Timeline. Found more than one session with a start time in the future`,
					{
						service: "gameServer",
						gameServer: server,
					},
				);

			if (server.game.ended)
				throw new ExtendedError(
					`Failed to load Timeline. Found a session with a start time in the future for an ended game`,
					{
						service: "gameServer",
						gameServer: server,
					},
				);

			const instance = new Timeline(
				server,
				[
					{
						startedAt: sessions[0].startedAt,
						startedAtTime: sessions[0].startedAt.getTime(),
						endedAt: null,
						startGameTime: 0,
						endGameTime: null,
						gameTimeDuration: null,
					},
				],
				"not-started",
			);

			instance.scheduler.scheduleAt(instance.currentSession.startedAtTime, async () => {
				instance._phase = "in-progress";

				logger.info(`Game ${server.game.id} (${server.game.type}) has started`);

				server.io.in(server.roomId).emit("general.timeline.start", { sync: new Date() });
			});

			return instance;
		}

		let cumulativeGameTime = 0;
		let foundRunningSession = false;

		const mappedSessions: GameSession[] = sessions.map((session) => {
			if (foundRunningSession)
				throw new ExtendedError(`Failed to load Timeline. Running session is not the last one`, {
					service: "gameServer",
					gameServer: server,
				});

			if (session.gameTimeDuration === null) {
				if (server.game.ended)
					throw new ExtendedError(`Failed to load Timeline. Found a running session for an ended game`, {
						service: "gameServer",
						gameServer: server,
					});

				foundRunningSession = true;

				return {
					startedAt: session.startedAt,
					startedAtTime: session.startedAt.getTime(),
					endedAt: null,
					startGameTime: cumulativeGameTime,
					endGameTime: null,
					gameTimeDuration: null,
				};
			} else {
				const extendedSession: GameSession = {
					startedAt: session.startedAt,
					startedAtTime: session.startedAt.getTime(),
					endedAt: new Date(session.startedAt.getTime() + session.gameTimeDuration * 1000),
					startGameTime: cumulativeGameTime,
					endGameTime: cumulativeGameTime + session.gameTimeDuration,
					gameTimeDuration: session.gameTimeDuration,
				};

				cumulativeGameTime += session.gameTimeDuration;

				return extendedSession;
			}
		});

		return new Timeline(
			server,
			mappedSessions,
			foundRunningSession ? "in-progress" : server.game.ended ? "ended" : "paused",
		);
	}

	private getTimeSync(now: number): GameTime {
		switch (this._phase) {
			case "not-started":
			case "in-progress":
				return Math.floor(
					(now - this.currentSession.startedAtTime + this.currentSession.startGameTime * 1000) / 1000,
				);

			case "paused":
			case "ended":
				return this.currentSession.endGameTime!;
		}
	}

	public get gameTime(): GameTime {
		return this.getTimeSync(Date.now());
	}

	public get phase(): TimelinePhase {
		return this._phase;
	}

	public get stateSync(): JoinGameDataPacket["timeline"] {
		const now = new Date();

		return {
			gameTime: this.getTimeSync(now.getTime()),
			sync: now,
			phase: this._phase,
		};
	}

	public async pause(): Promise<void> {
		if (this._phase !== "in-progress" || !(await this.server.canBePausedHook()))
			throw new UserRequestError("Cannot pause the game right now");

		const now = new Date();

		const gameTime = this.getTimeSync(now.getTime());

		logger.info(`Game ${this.server.fullName} has been paused at game time ${gameTime}`);

		this._phase = "paused";

		this.currentSession.endedAt = now;
		this.currentSession.endGameTime = gameTime;
		this.currentSession.gameTimeDuration = this.currentSession.endGameTime - this.currentSession.startGameTime;

		this.server.io.in(this.server.roomId).emit("general.timeline.pause", { gameTime, sync: now });

		await db
			.update(GameSessions)
			.set({
				gameTimeDuration: this.currentSession.gameTimeDuration,
			})
			.where(and(eq(GameSessions.gameId, this.server.game.id), isNull(GameSessions.gameTimeDuration)));
	}

	public async resume(): Promise<void> {
		if (this._phase !== "paused") throw new UserRequestError("Cannot resume a game that is not paused");

		logger.info(`Game ${this.server.fullName} has been resumed`);

		const now = new Date();

		const newSession: GameSession = {
			startedAt: now,
			startedAtTime: now.getTime(),
			endedAt: null,
			startGameTime: this.currentSession.endGameTime!,
			endGameTime: null,
			gameTimeDuration: null,
		};

		this.sessions.push(newSession);
		this.currentSession = newSession;

		this._phase = "in-progress";

		this.server.io
			.in(this.server.roomId)
			.emit("general.timeline.resume", { gameTime: this.currentSession.startGameTime, sync: now });

		await db.insert(GameSessions).values({
			gameId: this.server.game.id,
			startedAt: now,
		});
	}

	public stopHook(): void {
		this.scheduler.clear();
	}
}
