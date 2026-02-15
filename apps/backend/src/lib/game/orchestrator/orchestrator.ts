import { addPlayerToGame, scheduleNewGame } from "./gameManagement";

import { Dataset as DatasetType, Game, User } from "@jetlag/shared-types";
import { IdMap } from "~/lib/idMap";
import { logger } from "../../logger";
import { Scheduler } from "../../scheduler";
import { AppServer } from "../../types";
import { Dataset } from "../gameServer/dataset";
import { GameServer } from "../gameServer/gameServer";
import { loadState } from "./loadState";
import { getLobbyForUser } from "./restAPI";

export class Orchestrator {
	private constructor(
		protected readonly io: AppServer,
		protected readonly scheduler: Scheduler,
	) {}

	private static singletonInstance: Orchestrator | null = null;
	public static get instance(): Orchestrator {
		if (!Orchestrator.singletonInstance) throw new Error("Orchestrator has not been initialized yet");

		return Orchestrator.singletonInstance;
	}

	protected readonly servers: IdMap<Game["id"], GameServer> = new IdMap();
	public getServer(gameId: Game["id"]): GameServer | undefined {
		return this.servers.get(gameId);
	}
	public getDatasetForUser(userId: User["id"], datasetId: DatasetType["id"]): Dataset | undefined {
		return this.servers.find((server) => server.players.has(userId) && server.game.datasetId === datasetId)
			?.dataset;
	}

	private loadState = loadState;
	public static async initialize(io: AppServer): Promise<Orchestrator> {
		if (Orchestrator.singletonInstance) throw new Error("Orchestrator has already been initialized");

		const instance = new Orchestrator(io, new Scheduler());
		await instance.loadState();
		Orchestrator.singletonInstance = instance;

		logger.info("Orchestrator has been initialized");

		return instance;
	}

	public async restart(): Promise<void> {
		this.scheduler.clear();

		this.servers.concurrentForEach((server) => server.stop());

		this.servers.clear();

		await this.loadState();

		logger.info("Orchestrator has been restarted");
	}

	public getLobbyForUser = getLobbyForUser;

	public scheduleNewGame = scheduleNewGame;

	public addPlayerToGame = addPlayerToGame;
}
