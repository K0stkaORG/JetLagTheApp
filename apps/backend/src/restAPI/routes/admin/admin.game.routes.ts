import {
	AdminAddPlayerRequest,
	AdminCreateGameRequest,
	AdminCreateGameResponse,
	AdminGameInfoResponse,
	AdminGamesListResponse,
	AdminRequestWithGameId,
} from "@jetlag/shared-types";
import { Games, and, db, eq } from "~/db";

import { AdminRouteHandler } from "../../middleware/admin";
import { Orchestrator } from "~/lib/game/orchestrator/orchestrator";
import { Router } from "express";
import { UserError } from "~/restAPI/middleware/errorHandler";

const adminGamesRouter: Router = Router();

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
				gameAccess: {
					columns: {
						id: true,
					},
				},
			},
		});

		return games.map((game) => {
			const server = Orchestrator.instance.getServer(game.id);

			return {
				id: game.id,
				type: game.type,
				serverLoaded: !!server,
				timeline: server
					? server.timeline.stateSync
					: {
							sync: new Date(),
							gameTime: 0,
							phase: "not-started",
						},
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
			where: and(eq(Games.id, gameId), eq(Games.ended, false)),
			columns: {
				id: true,
				type: true,
			},
			with: {
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

		if (!game) throw new UserError("Game not found");

		const server = Orchestrator.instance.getServer(gameId);

		return {
			id: game.id,
			type: game.type,
			serverLoaded: !!server,
			timeline: server
				? server.timeline.stateSync
				: {
						sync: new Date(),
						gameTime: 0,
						phase: "not-started",
					},
			players: game.gameAccess.map((access) => {
				const player = server?.players.find((p) => p.user.id === access.user.id);

				return {
					userId: access.user.id,
					nickname: access.user.nickname,
					colors: access.user.colors,
					isOnline: player ? player.isOnline : false,
				};
			}),
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
	"/pause",
	AdminRouteHandler(AdminRequestWithGameId, async ({ gameId }): Promise<void> => {
		const server = Orchestrator.instance.getServer(gameId);

		if (!server) throw new UserError("Game server not found");

		if (!(await server.canBePausedHook())) throw new UserError("Game cannot be paused at this time");

		await server.timeline.pause();
	}),
);

adminGamesRouter.post(
	"/resume",
	AdminRouteHandler(AdminRequestWithGameId, async ({ gameId }): Promise<void> => {
		const server = Orchestrator.instance.getServer(gameId);

		if (!server) throw new UserError("Game server not found");

		if (server.timeline.phase !== "paused") throw new UserError("Game cannot be resumed at this time");

		await server.timeline.resume();
	}),
);

adminGamesRouter.post(
	"/create",
	AdminRouteHandler(AdminCreateGameRequest, async (gameData): Promise<AdminCreateGameResponse> => {
		return { id: await Orchestrator.instance.scheduleNewGame(gameData) };
	}),
);

export { adminGamesRouter };
