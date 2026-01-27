import { addUserAccessToGame, scheduleNewGame } from "./gameManagement";

import { AppServer } from "../../types";
import { Game } from "@jetlag/shared-types";
import { GameServer } from "../gameServer/gameServer";
import { Scheduler } from "../../scheduler";
import { getJoinAdvertisementsForUser } from "./restAPI";
import { loadState } from "./loadState";
import { logger } from "../../logger";
import { IdMap } from "~/lib/idMap";

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

	public getJoinAdvertisementsForUser = getJoinAdvertisementsForUser;

	public scheduleNewGame = scheduleNewGame;
	public addUserAccessToGame = addUserAccessToGame;
}
