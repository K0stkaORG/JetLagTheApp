import { asc, eq } from "drizzle-orm";
import { GameSessions, Games, db } from "~/db";

import { ENV } from "~/env";
import { ExtendedError } from "~/lib/errors";
import { logger } from "../../logger";
import { GameServerFactory } from "../gameServer/gameServerFactory";
import type { Orchestrator } from "./orchestrator";

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

	const startGameCutoff = Date.now() + ENV.START_SERVER_LEAD_TIME_MIN * 60_000;

	const serverPromises = [];
	for (const game of games)
		if (game.gameSessions[0].startedAt.getTime() <= startGameCutoff)
			serverPromises.push(GameServerFactory(this.io, game));
		else
			this.scheduler.scheduleAt(
				game.gameSessions[0].startedAt.getTime() - ENV.START_SERVER_LEAD_TIME_MIN * 60_000,
				async () => {
					const server = await GameServerFactory(this.io, game);

					this.servers.set(server.game.id, server);
				},
			);

	(await Promise.allSettled(serverPromises)).forEach((result) => {
		if (result.status === "rejected")
			throw new ExtendedError("Failed to load game server", { error: result.reason, service: "orchestrator" });

		this.servers.set(result.value.game.id, result.value);
	});
}
