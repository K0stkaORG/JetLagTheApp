import { Games, db } from "~/db";
import { asc, isNull } from "drizzle-orm";

import { AppServer } from "../types";
import { Game } from "@jetlag/shared-types";
import { GameServer } from "./gameServer";
import { GameServerFactory } from "./gameServerFactory";
import { env } from "~/env";
import { logger } from "../logger";

export class Orchestrator {
	private static singletonInstance: Orchestrator | null = null;

	private constructor(private readonly io: AppServer) {}

	public static get instance(): Orchestrator {
		if (!Orchestrator.singletonInstance) throw new Error("Orchestrator has not been initialized yet");

		return Orchestrator.singletonInstance;
	}

	private scheduledGames: Game[] = [];
	private gameServers: Map<Game["id"], GameServer> = new Map();

	public static async initialize(io: AppServer): Promise<Orchestrator> {
		if (Orchestrator.singletonInstance) throw new Error("Orchestrator has already been initialized");

		const instance = new Orchestrator(io);

		await instance.loadState();

		Orchestrator.singletonInstance = instance;

		logger.info("Orchestrator has been initialized");

		return instance;
	}

	private async loadState() {
		logger.info("Loading game servers from DB");

		const games = await db.query.Games.findMany({
			where: isNull(Games.endedAt),
			orderBy: asc(Games.startAt),
		});

		const startGameCutoff = Date.now() + env.START_SERVER_LEAD_TIME_MIN * 60_000;

		this.scheduledGames = games.filter((game) => game.startAt.getTime() > startGameCutoff);

		const servers = await Promise.allSettled(
			games
				.filter((game) => game.startAt.getTime() <= startGameCutoff)
				.map((game) => GameServerFactory(this.io, game)),
		);

		servers.forEach((result) => {
			if (result.status === "rejected") throw new Error("Failed to load game server:", result.reason);

			this.gameServers.set(result.value.game.id, result.value);
		});
	}
}
