import { Dataset as DatasetType, Game, IdMap, User } from "@jetlag/shared-types";
import { ExtendedError } from "~/lib/errors";
import { logger } from "../../logger";
import { Scheduler } from "../../scheduler";
import { AppServer } from "../../types";
import { GameServer } from "../gameServer/gameServer";
import { addPlayerToGame, deleteGame, endGame, restart, scheduleNewGame, stop } from "./gameManagement";
import { loadState } from "./loadState";
import { getLobbyForUser } from "./restAPI";

export class Orchestrator {
	private constructor(
		protected readonly io: AppServer,
		protected readonly scheduler: Scheduler,
	) {}

	private static singletonInstance: Orchestrator | null = null;
	public static get instance(): Orchestrator {
		if (!Orchestrator.singletonInstance)
			throw new ExtendedError("Orchestrator has not been initialized yet", {
				service: "orchestrator",
			});

		return Orchestrator.singletonInstance;
	}

	protected readonly servers: IdMap<Game["id"], GameServer> = new IdMap();
	public getServer(gameId: Game["id"]): GameServer | undefined {
		return this.servers.get(gameId);
	}
	public getGameServerWithDataset(userId: User["id"], datasetId: DatasetType["id"]): GameServer | undefined {
		return this.servers.find(
			(server) => server.datasetMetadata.datasetId === datasetId && server.players.has(userId),
		);
	}

	private loadState = loadState;
	public static async initialize(io: AppServer): Promise<Orchestrator> {
		if (Orchestrator.singletonInstance)
			throw new ExtendedError("Tried to initialize orchestrator after it has already been initialized", {
				service: "orchestrator",
			});

		const instance = new Orchestrator(io, new Scheduler());
		await instance.loadState();
		Orchestrator.singletonInstance = instance;

		logger.info("Orchestrator has been initialized");

		return instance;
	}

	public getLobbyForUser = getLobbyForUser;

	public scheduleNewGame = scheduleNewGame;

	public addPlayerToGame = addPlayerToGame;

	public restart = restart;

	public stop = stop;

	public endGame = endGame;

	public deleteGame = deleteGame;
}
