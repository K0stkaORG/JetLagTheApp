import { AdminCreateGameRequest, Game, GameSettingsSaveFormat, User, getInitialGameState } from "@jetlag/shared-types";
import {
	DatasetMetadata,
	Datasets,
	GameAccess,
	GameEvents,
	GameSessions,
	GameSettings,
	GameStates,
	Games,
	Users,
	db,
	eq,
} from "~/db";

import { ENV } from "~/env";
import { UserRequestError } from "~/lib/errors";
import { all } from "~/lib/utility";
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

	await all(
		db.insert(GameSessions).values({
			gameId: newGameId,
			startedAt: startAt,
		}),
		db.insert(GameSettings).values({
			gameId: newGameId,
			data: settings as GameSettingsSaveFormat,
		}),
		db.insert(GameStates).values({
			gameId: newGameId,
			data: getInitialGameState(type),
		}),
		db.insert(GameEvents).values({
			gameId: newGameId,
			event: {
				type: "gameStarted",
			},
			gameTime: 0,
		}),
	);

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
				columns: {
					id: true,
				},
			},
		},
	});

	if (!user) throw new UserRequestError("Invalid user ID");

	if (user.gameAccess.length > 0) throw new UserRequestError("This user already has access to the game");

	const game = await db.query.Games.findFirst({
		where: eq(Games.id, gameId),
		columns: {
			ended: true,
		},
	});

	if (!game) throw new UserRequestError(`Cannot find game with ID ${gameId}`);

	if (game.ended) throw new UserRequestError("Cannot add player to a game that has ended");

	await db.insert(GameAccess).values({
		gameId,
		userId,
	});

	await this.getServer(gameId)?.addPlayer(userId);
}
