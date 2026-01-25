import { LobbyListResponse } from "@jetlag/shared-types";
import { Orchestrator } from "~/lib/game/orchestrator/orchestrator";
import { ProtectedRouteHandler } from "../middleware/auth";
import { Router } from "express";

const lobbyRouter: Router = Router();

lobbyRouter.post(
	"/list",
	ProtectedRouteHandler(null, async (userId): Promise<LobbyListResponse> => {
		return Orchestrator.instance.getJoinAdvertisementsForUser(userId);
	}),
);

export { lobbyRouter };
