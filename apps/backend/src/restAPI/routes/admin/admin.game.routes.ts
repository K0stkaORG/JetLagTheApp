import { GameSessions, GameStates, Games, asc, db, desc, eq } from "@/db";
import {
	AdminAddPlayerRequest,
	AdminCreateGameRequest,
	AdminCreateGameResponse,
	AdminGameInfoResponse,
	AdminGamesListResponse,
	AdminRequestWithGameId,
	GameTime,
	TimelinePhase,
} from "@jetlag/shared-types";

import { ExtendedError, UserRequestError } from "@/lib/errors";
import { Orchestrator } from "@/lib/orchestrator/orchestrator";
import { Router } from "express";
import { AdminRouteHandler } from "../../middleware/admin";

const adminGamesRouter: Router = Router();

const getOfflineTimeline = (
	startedAt: Date | undefined,
): {
	sync: Date;
	gameTime: GameTime;
	phase: TimelinePhase;
} => {
	const now = new Date();
	return {
		sync: now,
		gameTime: startedAt ? now.getTime() - startedAt.getTime() : 0,
		phase: "not-started",
	};
};

adminGamesRouter.get(
	"/list",
	AdminRouteHandler(null, async (): Promise<AdminGamesListResponse> => {
		const games = await db.query.Games.findMany({
			where: eq(Games.ended, false),
			columns: {
				id: true,
				type: true,
			},
			with: {
				dataset: {
					columns: {
						version: true,
					},
					with: {
						metadata: {
							columns: {
								name: true,
							},
						},
					},
				},
				gameSessions: {
					columns: {
						startedAt: true,
					},
					orderBy: asc(GameSessions.startedAt),
					limit: 1,
				},
				gameAccess: {
					columns: {
						id: true,
					},
				},
			},
			orderBy: asc(Games.id),
		});

		return games.map((game) => {
			const server = Orchestrator.instance.getServer(game.id);

			return {
				id: game.id,
				type: game.type,
				serverLoaded: !!server,
				dataset: {
					name: game.dataset.metadata.name,
					version: game.dataset.version,
				},
				timeline: server ? server.timeline.state : getOfflineTimeline(game.gameSessions[0]?.startedAt),
				players: {
					online: server ? server.players.filter((player) => player.isOnline).length : 0,
					total: game.gameAccess.length,
				},
			};
		});
	}),
);

adminGamesRouter.post(
	"/info",
	AdminRouteHandler(AdminRequestWithGameId, async ({ gameId }): Promise<AdminGameInfoResponse> => {
		const game = await db.query.Games.findFirst({
			where: eq(Games.id, gameId),
			columns: {
				id: true,
				type: true,
			},
			with: {
				dataset: {
					columns: {
						version: true,
					},
					with: {
						metadata: {
							columns: {
								name: true,
							},
						},
					},
				},
				gameSessions: {
					columns: {
						startedAt: true,
					},
					orderBy: asc(GameSessions.startedAt),
					limit: 1,
				},
				gameSettings: {
					columns: { data: true },
				},
				gameStates: {
					columns: { data: true },
					orderBy: desc(GameStates.id),
					limit: 1,
				},
				gameAccess: {
					columns: {},
					with: {
						user: {
							columns: {
								id: true,
								nickname: true,
								colors: true,
							},
						},
					},
				},
			},
		});

		if (!game) throw new UserRequestError("Game not found");

		const server = Orchestrator.instance.getServer(gameId);

		return {
			id: game.id,
			type: game.type,
			serverLoaded: !!server,
			dataset: {
				name: game.dataset.metadata.name,
				version: game.dataset.version,
			},
			timeline: server ? server.timeline.state : getOfflineTimeline(game.gameSessions[0]?.startedAt),
			players: game.gameAccess.map((access) => ({
				userId: access.user.id,
				nickname: access.user.nickname,
				colors: access.user.colors,
				isOnline: server?.players.get(access.user.id)?.isOnline ?? false,
			})),
			settings: game.gameSettings!.data,
			state: game.gameStates[0]!.data,
		};
	}),
);

adminGamesRouter.post(
	"/add-player",
	AdminRouteHandler(AdminAddPlayerRequest, async ({ gameId, userId }): Promise<void> => {
		await Orchestrator.instance.addPlayerToGame(gameId, userId);
	}),
);

adminGamesRouter.post(
	"/create",
	AdminRouteHandler(AdminCreateGameRequest, async (gameData): Promise<AdminCreateGameResponse> => {
		const id = await Orchestrator.instance.scheduleNewGame(gameData);

		return { id };
	}),
);

adminGamesRouter.post(
	"/pause",
	AdminRouteHandler(AdminRequestWithGameId, async ({ gameId }) => {
		const server = Orchestrator.instance.getServer(gameId);

		if (!server) throw new UserRequestError("Game server not found");

		await server.timeline.pause().catch(ExtendedError.extractUserRequestError);
	}),
);

adminGamesRouter.post(
	"/resume",
	AdminRouteHandler(AdminRequestWithGameId, async ({ gameId }) => {
		const server = Orchestrator.instance.getServer(gameId);

		if (!server) throw new UserRequestError("Game server not found");

		await server.timeline.resume().catch(ExtendedError.extractUserRequestError);
	}),
);

adminGamesRouter.post(
	"/restart",
	AdminRouteHandler(AdminRequestWithGameId, async ({ gameId }) => Orchestrator.instance.restartServer(gameId)),
);

adminGamesRouter.post(
	"/end",
	AdminRouteHandler(AdminRequestWithGameId, async ({ gameId }) => Orchestrator.instance.endGame(gameId)),
);

adminGamesRouter.post(
	"/delete",
	AdminRouteHandler(AdminRequestWithGameId, async ({ gameId }) => Orchestrator.instance.deleteGame(gameId)),
);

export { adminGamesRouter };
