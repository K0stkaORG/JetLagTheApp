import { Game, User } from "@jetlag/shared-types";
import { GameAccess, GameSessions, Games, Users, db, eq } from "~/db";

import { ENV } from "~/env";
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

export async function addUserAccessToGame(this: Orchestrator, gameId: Game["id"], userId: User["id"]): Promise<void> {
	const user = await db.query.Users.findFirst({
		where: eq(Users.id, userId),
		columns: {},
		with: {
			gameAccess: {
				where: eq(GameAccess.gameId, gameId),
				columns: {
					gameId: true,
				},
			},
		},
	});

	if (!user) throw new UserError("Invalid user ID");

	if (user.gameAccess.length > 0) throw new UserError("This user already has access to the game");

	await db.insert(GameAccess).values({
		gameId,
		userId,
	});

	await this.servers.get(gameId)?.addUserAccess(userId);
}
