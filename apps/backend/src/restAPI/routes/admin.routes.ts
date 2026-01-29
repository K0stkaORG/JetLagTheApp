import {
	AdminCreateGameRequest,
	AdminCreateGameResponse,
	AdminGamesListResponse,
	AdminLoginRequest,
} from "@jetlag/shared-types";
import { Games, db, eq } from "~/db";

import { AdminRouteHandler } from "../middleware/admin";
import { Auth } from "~/lib/auth";
import { ENV } from "~/env";
import { Orchestrator } from "~/lib/game/orchestrator/orchestrator";
import { RouteHandler } from "../middleware/validation";
import { Router } from "express";
import { UserError } from "../middleware/errorHandler";

const adminRouter: Router = Router();

adminRouter.post(
	"/login",
	RouteHandler(AdminLoginRequest, async ({ username, password }) => {
		if (username !== ENV.ADMIN_USERNAME || password !== ENV.ADMIN_PASSWORD)
			throw new UserError("Invalid admin credentials");

		const token = await Auth.jwt.create(0);

		return { result: "success", token };
	}),
);

adminRouter.get(
	"/games/list",
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
					total: server ? server.players.count : 0,
				},
			};
		});
	}),
);

adminRouter.post(
	"/games/create",
	AdminRouteHandler(AdminCreateGameRequest, async (gameData): Promise<AdminCreateGameResponse> => {
		return { id: await Orchestrator.instance.scheduleNewGame(gameData) };
	}),
);

export { adminRouter };
