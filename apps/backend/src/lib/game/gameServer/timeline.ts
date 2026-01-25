import { GameSessions, and, asc, db, eq } from "~/db";

import { GameServer } from "./gameServer";
import { isNull } from "drizzle-orm";

type GameSession =
	| {
			startedAt: Date;
			endedAt: null;
			startGameTime: number;
			endGameTime: null;
			gameTimeDuration: null;
	  }
	| {
			startedAt: Date;
			endedAt: Date;
			startGameTime: number;
			endGameTime: number;
			gameTimeDuration: number;
	  };

const getGameTimeOffset = (session: GameSession): number => session.startGameTime - session.startedAt.getTime();

export class Timeline {
	private constructor(
		private readonly server: GameServer,
		private readonly sessions: GameSession[],
		private gameTimeOffset: number, // If paused, the game time at which it was paused
		private paused: boolean,
	) {}

	public static async load(server: GameServer): Promise<Timeline> {
		const sessions = await db.query.GameSessions.findMany({
			where: eq(GameSessions.gameId, server.game.id),
			columns: {
				startedAt: true,
				endedAt: true,
				gameTimeDuration: true,
			},
			orderBy: asc(GameSessions.startedAt),
		});

		let cumulativeGameTime = 0;
		let currentSession: GameSession | null = null;

		const extendedSessions: GameSession[] = sessions.map((session) => {
			if (currentSession)
				throw new Error(
					`Failed to load Timeline. Found session starting after an active session for game ${server.game.id}. Your data is likely corrupted.`,
				);

			if (!session.endedAt) {
				const extendedSession: GameSession = {
					startedAt: session.startedAt,
					endedAt: null,
					startGameTime: cumulativeGameTime,
					endGameTime: null,
					gameTimeDuration: null,
				};

				currentSession = extendedSession;

				return extendedSession;
			}

			const extendedSession: GameSession = {
				startedAt: session.startedAt,
				endedAt: session.endedAt,
				startGameTime: cumulativeGameTime,
				endGameTime: cumulativeGameTime + session.gameTimeDuration!,
				gameTimeDuration: session.gameTimeDuration!,
			};

			cumulativeGameTime += session.gameTimeDuration!;

			return extendedSession;
		});

		const timeline = new Timeline(
			server,
			extendedSessions,
			currentSession ? getGameTimeOffset(currentSession) : cumulativeGameTime,
			!!currentSession,
		);

		return timeline;
	}

	public get gameTime(): number {
		return this.getTimeSync(Date.now());
	}
	private getTimeSync(now: number): number {
		if (this.isPaused) return this.gameTimeOffset;

		return this.gameTimeOffset + now;
	}

	public gameTimeToDate(gameTime: number): Date {
		for (const session of this.sessions)
			if (
				session.startGameTime <= gameTime &&
				(session.endGameTime === null || session.endGameTime >= gameTime)
			) {
				const delta = gameTime - session.startGameTime;

				return new Date(session.startedAt.getTime() + delta);
			}

		throw new Error(
			`Failed to convert game time ${gameTime} to date for game ${this.server.game.id} as it hasn't occurred yet.`,
		);
	}

	public dateToGameTime(date: Date): number {
		for (const session of this.sessions)
			if (session.startedAt <= date && (session.endedAt === null || session.endedAt >= date)) {
				const delta = date.getTime() - session.startedAt.getTime();

				return session.startGameTime + delta;
			}

		throw new Error(
			`Failed to convert date ${date.toISOString()} to game time for game ${this.server.game.id} as it hasn't occurred yet.`,
		);
	}

	public get isPaused(): boolean {
		return this.paused;
	}

	public async pause(): Promise<void> {
		if (this.paused) return;

		const now = new Date();

		this.gameTimeOffset = this.getTimeSync(now.getTime());
		this.paused = true;

		this.sessions[this.sessions.length - 1].endedAt = now;
		this.sessions[this.sessions.length - 1].endGameTime = this.gameTimeOffset;
		this.sessions[this.sessions.length - 1].gameTimeDuration =
			this.sessions[this.sessions.length - 1].endGameTime! -
			this.sessions[this.sessions.length - 1].startGameTime;

		await db
			.update(GameSessions)
			.set({
				endedAt: now,
				gameTimeDuration: this.sessions[this.sessions.length - 1].gameTimeDuration,
			})
			.where(and(eq(GameSessions.gameId, this.server.game.id), isNull(GameSessions.endedAt)));
	}

	public async resume(): Promise<void> {
		if (!this.paused) return;

		const now = new Date();

		const newSession: GameSession = {
			startedAt: now,
			endedAt: null,
			startGameTime: this.gameTimeOffset,
			endGameTime: null,
			gameTimeDuration: null,
		};

		this.sessions.push(newSession);

		this.gameTimeOffset = getGameTimeOffset(newSession);
		this.paused = false;

		await db.insert(GameSessions).values({
			gameId: this.server.game.id,
			startedAt: now,
		});
	}
}
