import { GameServer, sDataset, sGameSettings, sTimeline } from "./gameServer";

import { logger } from "~/lib/logger";
import { DatasetFactory } from "./datasetFactory";
import { GameSettingsFactory } from "./gameSettingsFactory";
import { PlayerFactory } from "./playerFactory";
import { Timeline } from "./timeline";

async function loadPlayers(server: GameServer) {
	const factory = PlayerFactory(server);

	const players = await factory.getAllForServer();

	players.forEach((player) => server.players.set(player.user.id, player));
}

async function loadTimeline(server: GameServer) {
	const timeline = await Timeline.load(server);

	server[sTimeline] = timeline;
}

async function loadDataset(server: GameServer) {
	const dataset = await DatasetFactory(server);

	server[sDataset] = dataset;
}

async function loadGameSettings(server: GameServer) {
	const gameSettings = await GameSettingsFactory(server);

	server[sGameSettings] = gameSettings;
}

export async function startServer(this: GameServer) {
	(
		await Promise.allSettled([loadPlayers(this), loadTimeline(this), loadDataset(this), loadGameSettings(this)])
	).forEach((result) => {
		if (result.status === "rejected")
			throw new Error(`Error occurred when starting game server for game ${this.fullName}: ${result.reason}`);
	});

	await this.startHook();

	logger.info(`Started game server for game ${this.fullName}`);
}

export async function stopServer(this: GameServer) {
	logger.info(`Shutting down game server for game ${this.fullName}`);

	this.timeline.stopHook();

	this.io.in(this.roomId).emit("general.shutdown");

	await this.stopHook();

	this.io.in(this.roomId).disconnectSockets(true);
}
