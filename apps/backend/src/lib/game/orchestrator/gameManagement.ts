import { AdminCreateGameRequest, Game, GameSettingsSaveFormat, User } from "@jetlag/shared-types";
import { DatasetMetadata, Datasets, GameAccess, GameSessions, GameSettings, Games, Users, db, eq } from "~/db";

import { ENV } from "~/env";
import { UserRequestError } from "~/lib/errors";
import { GameServerFactory } from "../gameServer/gameServerFactory";
import { Orchestrator } from "./orchestrator";

export async function scheduleNewGame(
	this: Orchestrator,
	{ type, startAt, datasetMetadataId, settings }: AdminCreateGameRequest,
): Promise<Game["id"]> {
	if (startAt < new Date()) throw new UserRequestError("Cannot schedule a game in the past");

	const datasetMetadata = await db.query.DatasetMetadata.findFirst({
		where: eq(DatasetMetadata.id, datasetMetadataId),
		columns: {
			gameType: true,
		},
		with: {
			datasets: {
				columns: {
					id: true,
				},
				where: eq(Datasets.latest, true),
			},
		},
	});

	if (!datasetMetadata) throw new UserRequestError(`Dataset with ID ${datasetMetadataId} does not exist`);
	if (datasetMetadata.gameType !== type)
		throw new UserRequestError(`Dataset type mismatch: expected ${type}, got ${datasetMetadata.gameType}`);

	const newGameId = await db
		.insert(Games)
		.values({
			type,
			datasetId: datasetMetadata.datasets[0].id,
		})
		.returning({ id: Games.id })
		.then((res) => res[0].id);

	await db.insert(GameSessions).values({
		gameId: newGameId,
		startedAt: startAt,
	});

	await db.insert(GameSettings).values({
		gameId: newGameId,
		data: settings as GameSettingsSaveFormat,
	});

	this.scheduler.scheduleAt(startAt.getTime() - ENV.START_SERVER_LEAD_TIME_MIN * 60_000, async () => {
		const gameServer = await GameServerFactory(this.io, {
			id: newGameId,
			type,
			datasetId: datasetMetadata.datasets[0].id,
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

	if (!user) throw new UserRequestError("Invalid user ID");

	if (user.gameAccess.length > 0) throw new UserRequestError("This user already has access to the game");

	if (user.gameAccess[0]?.game.ended) throw new UserRequestError("Cannot add player to a game that has ended");

	await db.insert(GameAccess).values({
		gameId,
		userId,
	});

	await this.getServer(gameId)?.addPlayer(userId);
}
