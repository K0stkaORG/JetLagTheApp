import { GameSessions, Games, db } from "~/db";
import { asc, eq } from "drizzle-orm";

import { GameServerFactory } from "../gameServer/gameServerFactory";
import type { Orchestrator } from "./orchestrator";
import { env } from "~/env";
import { logger } from "../../logger";

export async function loadState(this: Orchestrator) {
	logger.info("Loading game servers from DB");

	const games = await db.query.Games.findMany({
		where: eq(Games.ended, false),
		with: {
			gameSessions: {
				limit: 1,
				orderBy: asc(GameSessions.startedAt),
				columns: {
					startedAt: true,
				},
			},
		},
	});

	const startGameCutoff = Date.now() + env.START_SERVER_LEAD_TIME_MIN * 60_000;

	const servers = [];
	for (const game of games)
		if (game.gameSessions[0].startedAt.getTime() <= startGameCutoff) servers.push(GameServerFactory(this.io, game));
		else
			this.scheduler.scheduleAt(
				game.gameSessions[0].startedAt.getTime() - env.START_SERVER_LEAD_TIME_MIN * 60_000,
				async () => {
					const server = await GameServerFactory(this.io, game);

					this.gameServers.set(server.game.id, server);
					this.gameServerIds.push(server.game.id);
				},
			);

	(await Promise.allSettled(servers)).forEach((result) => {
		if (result.status === "rejected") throw new Error(result.reason);

		this.gameServers.set(result.value.game.id, result.value);
		this.gameServerIds.push(result.value.game.id);
	});
}
