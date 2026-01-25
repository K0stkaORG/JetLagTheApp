import { GameAccess, db, eq } from "~/db";

import type { GameServer } from "./gameServer";
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

	players.forEach(({ user }) => this[this.SYMBOLS.players].set(user.id, user));
}

export async function startServer(this: GameServer) {
	await loadPlayers.call(this);
	await this.startHook();

	logger.info(`Started game server for game ${this.game.id} (${this.game.type})`);
}

export async function stopServer(this: GameServer) {
	logger.info(`Shutting down game server for game ${this.game.id} (${this.game.type})`);

	await this.stopHook();

	this.io.socketsLeave(this.roomId);
}
