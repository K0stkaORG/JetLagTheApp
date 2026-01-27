import { GameServer, sTimeline } from "./gameServer";

import { PlayerFactory } from "./playerFactory";
import { Timeline } from "./timeline";
import { logger } from "~/lib/logger";

async function loadPlayers(server: GameServer) {
	const factory = PlayerFactory(server);

	const players = await factory.getAllForServer();

	players.forEach((player) => {
		server.players.set(player.user.id, player);
		server.playerIds.push(player.user.id);
	});
}

async function loadTimeline(server: GameServer) {
	const timeline = await Timeline.load(server);

	server[sTimeline] = timeline;
}

export async function startServer(this: GameServer) {
	(await Promise.allSettled([loadPlayers(this), loadTimeline(this)])).forEach((result) => {
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

	this.io.in(this.roomId).disconnectSockets(true);

	await this.stopHook();
}
