import { addUserAccessToGame, scheduleNewGame } from "./gameManagement";

import { AppServer } from "../../types";
import { Game } from "@jetlag/shared-types";
import { GameServer } from "../gameServer/gameServer";
import { Scheduler } from "../../scheduler";
import { getJoinAdvertisementsForUser } from "./restAPI";
import { loadState } from "./loadState";
import { logger } from "../../logger";

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

	protected gameServerIds: Game["id"][] = [];
	protected gameServers: Map<Game["id"], GameServer> = new Map();

	public getServer(gameId: Game["id"]): GameServer | undefined {
		return this.gameServers.get(gameId);
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

		this.gameServerIds.map((id) => this.gameServers.get(id)).forEach((server) => server!.stop());

		this.gameServers.clear();
		this.gameServerIds = [];

		await this.loadState();

		logger.info("Orchestrator has been restarted");
	}

	public getJoinAdvertisementsForUser = getJoinAdvertisementsForUser;

	public scheduleNewGame = scheduleNewGame;
	public addUserAccessToGame = addUserAccessToGame;
}
