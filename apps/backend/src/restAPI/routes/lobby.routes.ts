import { LobbyListResponse } from "@jetlag/shared-types";
import { Orchestrator } from "~/lib/game/orchestrator/orchestrator";
import { ProtectedRouteHandler } from "../middleware/auth";
import { Router } from "express";
import z from "zod";

const lobbyRouter: Router = Router();

lobbyRouter.post(
	"/list",
	ProtectedRouteHandler(z.any(), async (userId): Promise<LobbyListResponse> => {
		return Orchestrator.instance.getJoinAdvertisementsForUser(userId);
	}),
);

export { lobbyRouter };
