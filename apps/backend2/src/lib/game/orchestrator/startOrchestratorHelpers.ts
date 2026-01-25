import { Games, db } from "~/db";
import { asc, isNull } from "drizzle-orm";

import { GameServerFactory } from "../gameServer/gameServerFactory";
import type { Orchestrator } from "./orchestrator";
import { env } from "~/env";
import { logger } from "../../logger";

export async function loadState(this: Orchestrator) {
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
		if (result.status === "rejected") throw new Error("Failed to load game server: " + result.reason);

		this.gameServers.set(result.value.game.id, result.value);
		this.gameServerIds.push(result.value.game.id);
	});
}
