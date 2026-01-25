import { AppServer } from "../../types";
import { Game } from "@jetlag/shared-types";
import { GameServer } from "../gameServer/gameServer";
import { getJoinAdvertisementsForUser } from "./restAPIHelpers";
import { loadState } from "./startOrchestratorHelpers";
import { logger } from "../../logger";

export class Orchestrator {
	private constructor(protected readonly io: AppServer) {}
	private static singletonInstance: Orchestrator | null = null;
	public static get instance(): Orchestrator {
		if (!Orchestrator.singletonInstance) throw new Error("Orchestrator has not been initialized yet");

		return Orchestrator.singletonInstance;
	}

	protected scheduledGames: Game[] = [];
	protected gameServerIds: Game["id"][] = [];
	protected gameServers: Map<Game["id"], GameServer> = new Map();

	private loadState = loadState;
	public static async initialize(io: AppServer): Promise<Orchestrator> {
		if (Orchestrator.singletonInstance) throw new Error("Orchestrator has already been initialized");

		const instance = new Orchestrator(io);
		await instance.loadState();
		Orchestrator.singletonInstance = instance;

		logger.info("Orchestrator has been initialized");

		return instance;
	}

	public getJoinAdvertisementsForUser = getJoinAdvertisementsForUser;
}
