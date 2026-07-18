import { GameServer, sDataset, sEventManager, sGameSettings, sGameState, sQueue, sTimeline } from "./gameServer";

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
	server[sDataset] = await DatasetFactory(server);
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

export async function startServer(this: GameServer) {
	const queue = new CommandQueue(this);
	this[sQueue] = queue;

	await all(
		loadPlayers(this),
		loadTimeline(this),
		loadDataset(this),
		loadGameSettings(this),
		loadGameState(this),
		loadEventManager(this),
	).catch((error) => {
		throw new ExtendedError(`Failed to start game ${this.fullName}`, {
			service: "gameServer",
			gameServer: this,
			error,
		});
	});

	try {
		this.validateGameSettingsForDataset();
	} catch (error) {
		throw new ExtendedError(`GameSettings are not valid for dataset ${this.dataset.name}`, {
			error,
			service: "gameServer",
			gameServer: this,
		});
	}

	await this.startHook();

	queue.start();
	this.eventManager.resume(this.timeline.gameTime);

	logger.info(`Started game server for game ${this.fullName}`);
}

export async function stopServer(this: GameServer) {
	logger.info(`Shutting down game server for game ${this.fullName}`);

	this.eventManager.pause();
	this.timeline.stopHook();

	this.io.in(this.roomId).emit("general.shutdown");

	await this.stopHook();

	await this[sQueue]?.stop();

	this.io.in(this.roomId).disconnectSockets(true);
}
