import {
	GameServer,
	sDataset,
	sDatasetMetadata,
	sEventManager,
	sGameSettings,
	sGameState,
	sQueue,
	sTimeline,
} from "./gameServer";

import { ExtendedError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { all } from "~/lib/utility";
import { CommandQueue } from "./commandQueue";
import { DatasetFactory } from "./datasetFactory";
import { EventManager } from "./eventManager";
import { GameSettingsFactory } from "./gameSettingsFactory";
import { GameStateFactory } from "./gameStateFactory";
import { PlayerFactory } from "./playerFactory";
import { Timeline } from "./timeline";

async function loadPlayers(server: GameServer) {
	const factory = PlayerFactory(server);

	const players = await factory.getAllForServer();

	players.forEach((player) => server.players.set(player.user.id, player));
}

async function loadTimeline(server: GameServer) {
	server[sTimeline] = await Timeline.load(server);
}

async function loadDataset(server: GameServer) {
	const { metadata, data } = await DatasetFactory(server);

	server[sDatasetMetadata] = metadata;
	server[sDataset] = data;
}

async function loadGameSettings(server: GameServer) {
	server[sGameSettings] = await GameSettingsFactory(server);
}

async function loadGameState(server: GameServer) {
	server[sGameState] = await GameStateFactory(server);
}

async function loadEventManager(server: GameServer) {
	server[sEventManager] = await EventManager.load(server);
}

export async function loadServer(this: GameServer) {
	const queue = new CommandQueue(this);
	this[sQueue] = queue;

	await all(
		loadTimeline(this),
		loadDataset(this),
		loadGameSettings(this),
		loadGameState(this),
		loadEventManager(this),
	)
		.then(async () => {
			await loadPlayers(this);
		})
		.catch((error) => {
			throw new ExtendedError(`Failed to start`, {
				service: "gameServer",
				gameServer: this,
				error,
			});
		});

	try {
		this.validateGameSettingsForDataset();
	} catch (error) {
		throw new ExtendedError(`GameSettings are not valid for this dataset`, {
			error,
			service: "gameServer",
			gameServer: this,
		});
	}

	logger.info(`Loaded game server for game ${this.fullName}`);
}

export async function startServer(this: GameServer) {
	await this.startHook();

	this[sQueue]!.start();
	this.eventManager.resume(this.timeline.gameTime);

	logger.info(`Started game server for game ${this.fullName}`);
}

export async function stopServer(this: GameServer, reason?: string) {
	logger.info(`Shutting down game server for game ${this.fullName}`);

	this.eventManager.pause();
	this.timeline.stopHook();

	if (reason) this.io.in(this.roomId).emit("general.notification", { message: `Server shutting down: ${reason}` });

	this.io.in(this.roomId).emit("general.shutdown");

	await this.stopHook();

	await this[sQueue]?.stop();

	this.io.in(this.roomId).disconnectSockets(true);
}
