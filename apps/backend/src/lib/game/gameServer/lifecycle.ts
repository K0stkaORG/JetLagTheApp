import { GameAccess, db, eq } from "~/db";
import { GameServer, sPlayers, sTimeline } from "./gameServer";

import { Timeline } from "./timeline";
import { logger } from "~/lib/logger";

async function loadPlayers(this: GameServer) {
	const players = await db.query.GameAccess.findMany({
		where: eq(GameAccess.gameId, this.game.id),
		columns: {},
		with: {
			user: {
				columns: {
					id: true,
					nickname: true,
					colors: true,
				},
			},
		},
	});

	players.forEach(({ user }) => this[sPlayers].set(user.id, user));
}

async function loadTimeline(this: GameServer) {
	const timeline = await Timeline.load(this);

	this[sTimeline] = timeline;
}

export async function startServer(this: GameServer) {
	(await Promise.allSettled([loadPlayers.call(this), loadTimeline.call(this)])).forEach((result) => {
		if (result.status === "rejected")
			throw new Error(
				`Error occurred when starting game server for game ${this.game.id} (${this.game.type}): ` +
					result.reason,
			);
	});

	await this.startHook();

	logger.info(`Started game server for game ${this.game.id} (${this.game.type})`);
}

export async function stopServer(this: GameServer) {
	logger.info(`Shutting down game server for game ${this.game.id} (${this.game.type})`);

	this.timeline.stopHook();

	await this.stopHook();

	this.io.socketsLeave(this.roomId);
}
