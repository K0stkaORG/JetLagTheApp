import { Dataset, Game, User } from "@jetlag/shared-types";
import { Datasets, GameAccess, GameSessions, Games, Users, db, eq } from "~/db";

import { ENV } from "~/env";
import { GameServerFactory } from "../gameServer/gameServerFactory";
import { Orchestrator } from "./orchestrator";
import { UserError } from "~/restAPI/middleware/errorHandler";

export async function scheduleNewGame(
	this: Orchestrator,
	{
		type,
		startAt,
		datasetId,
	}: {
		type: Game["type"];
		startAt: Date;
		datasetId: Dataset["id"];
	},
): Promise<Game["id"]> {
	if (startAt < new Date()) throw new UserError("Cannot schedule a game in the past");

	const datasetExists = await db.query.Datasets.findFirst({
		where: eq(Datasets.id, datasetId),
		columns: {
			id: true,
		},
	});

	if (!datasetExists) throw new UserError(`Dataset with ID ${datasetId} does not exist`);

	const newGameId = await db
		.insert(Games)
		.values({
			type,
			datasetId,
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
			datasetId,
			ended: false,
		});

		this.servers.set(newGameId, gameServer);
	});

	return newGameId;
}

export async function addPlayerToGame(this: Orchestrator, gameId: Game["id"], userId: User["id"]): Promise<void> {
	const user = await db.query.Users.findFirst({
		where: eq(Users.id, userId),
		columns: {},
		with: {
			gameAccess: {
				where: eq(GameAccess.gameId, gameId),
				columns: {},
				with: {
					game: {
						columns: {
							ended: true,
						},
					},
				},
			},
		},
	});

	if (!user) throw new UserError("Invalid user ID");

	if (user.gameAccess.length > 0) throw new UserError("This user already has access to the game");

	if (user.gameAccess[0]?.game.ended) throw new UserError("Cannot add player to a game that has ended");

	await db.insert(GameAccess).values({
		gameId,
		userId,
	});

	await this.getServer(gameId)?.addPlayer(userId);
}
