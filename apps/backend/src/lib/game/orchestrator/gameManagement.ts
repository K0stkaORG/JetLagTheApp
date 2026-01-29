import { GameSessions, Games, db } from "~/db";

import { ENV } from "~/env";
import { Game } from "@jetlag/shared-types";
import { GameServerFactory } from "../gameServer/gameServerFactory";
import { Orchestrator } from "./orchestrator";
import { UserError } from "~/restAPI/middleware/errorHandler";

export async function scheduleNewGame(
	this: Orchestrator,
	{
		type,
		startAt,
	}: {
		type: Game["type"];
		startAt: Date;
	},
): Promise<Game["id"]> {
	if (startAt < new Date()) throw new UserError("Cannot schedule a game in the past");

	const newGameId = await db
		.insert(Games)
		.values({
			type,
		})
		.returning({ id: Games.id })
		.then((res) => res[0].id);

	await db.insert(GameSessions).values({
		gameId: newGameId,
		startedAt: startAt,
	});

	this.scheduler.scheduleAt(startAt.getTime() - ENV.START_SERVER_LEAD_TIME_MIN * 60_000, async () => {
		const gameServer = await GameServerFactory(this.io, {
			id: newGameId,
			type,
			ended: false,
		});

		this.servers.set(newGameId, gameServer);
	});

	return newGameId;
}
