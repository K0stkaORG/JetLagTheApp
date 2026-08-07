import { LobbyListResponse } from "@jetlag/shared-types";
import { Router } from "express";
import { Orchestrator } from "~/lib/orchestrator/orchestrator";
import { ProtectedRouteHandler } from "../middleware/auth";

const lobbyRouter: Router = Router();

lobbyRouter.get(
	"/",
	ProtectedRouteHandler(null, async (userId): Promise<LobbyListResponse> => {
		return Orchestrator.instance.getLobbyForUser(userId);
	}),
);

export { lobbyRouter };
