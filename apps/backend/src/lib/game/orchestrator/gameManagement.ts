import {
	ADMIN_TELEMETRY_ROOM,
	AdminCreateGameRequest,
	Game,
	GameSettingsSaveFormat,
	User,
	getInitialGameState,
} from "@jetlag/shared-types";
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
	inArray,
} from "~/db";

import { ENV } from "~/env";
import { UserRequestError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { all } from "~/lib/utility";
import { GameServerFactory } from "../gameServer/gameServerFactory";
import { Orchestrator } from "./orchestrator";

export async function scheduleNewGame(
	this: Orchestrator,
	{ type, startAt, metadataId, settings, playerUserIds }: AdminCreateGameRequest,
): Promise<Game["id"]> {
	if (startAt < new Date()) throw new UserRequestError("Cannot schedule a game in the past");

	const datasetMetadata = await db.query.DatasetMetadata.findFirst({
		where: eq(DatasetMetadata.id, metadataId),
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

	if (!datasetMetadata) throw new UserRequestError(`Dataset with ID ${metadataId} does not exist`);
	if (datasetMetadata.gameType !== type)
		throw new UserRequestError(`Dataset type mismatch: expected ${type}, got ${datasetMetadata.gameType}`);

	if (playerUserIds.length > 0) {
		const usersIds = await db.query.Users.findMany({
			where: inArray(Users.id, playerUserIds),
			columns: {
				id: true,
			},
		})
			.then((users) => users.map((user) => user.id))
			.then((ids) => new Set(ids));

		for (const userId of playerUserIds)
			if (!usersIds.has(userId)) throw new UserRequestError(`User with ID ${userId} does not exist`);
	}

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
			gameTime: 0,
			data: getInitialGameState(type),
		}),
		db.insert(GameEvents).values({
			gameId: newGameId,
			event: {
				type: "gameStarted",
			},
			gameTime: 0,
		}),
		playerUserIds.length > 0
			? db.insert(GameAccess).values(
					playerUserIds.map((userId) => ({
						gameId: newGameId,
						userId,
					})),
				)
			: Promise.resolve(),
	);

	this.scheduler.scheduleAt(startAt.getTime() - ENV.START_SERVER_LEAD_TIME_MIN * 60_000, async () => {
		await GameServerFactory(
			this.io,
			{
				id: newGameId,
				type,
				datasetId: datasetMetadata.datasets[0].id,
				ended: false,
			},
			(server) => this.servers.set(newGameId, server),
		);
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

export async function restart(this: Orchestrator): Promise<void> {
	logger.info("Restarting orchestrator...");

	this.scheduler.clear();

	await this.servers.concurrentForEach((server) => server.stop("Server restart"));

	this.servers.clear();

	this.io.except(ADMIN_TELEMETRY_ROOM).disconnectSockets();

	await this["loadState"]();

	logger.info("Orchestrator has been restarted");
}

export async function stop(this: Orchestrator, reason?: string): Promise<void> {
	logger.info("Stopping orchestrator...");

	this.scheduler.clear();

	await this.servers.concurrentForEach((server) => server.stop(reason));

	this.servers.clear();

	logger.info("Orchestrator has been stopped");
}

export async function endGame(this: Orchestrator, gameId: Game["id"]) {
	const server = this.servers.get(gameId);
	if (!server) throw new UserRequestError("Game server not found");

	await server.timeline["end"]();
}

export async function deleteGame(this: Orchestrator, gameId: Game["id"]) {
	logger.info(`Deleting game #${gameId}`);

	const server = this.servers.get(gameId);

	if (server) {
		await server.stop("Game deleted");
		this.servers.delete(gameId);
	}

	await db.delete(Games).where(eq(Games.id, gameId));
}
