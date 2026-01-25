import { Success, UserError, handler } from "~/lib/apiRouteHandler";

import { Orchestrator } from "~/lib/orchestrator";
import { Router } from "express";
import { protectedRoute } from "~/lib/auth";

export const gameRouter = (ORCHESTRATOR: Orchestrator) => {
	const gameRouter = Router();

	gameRouter.get(
		"/joinable",
		[protectedRoute],
		handler(({ locals }) => Success(ORCHESTRATOR.getJoinableGamesForUser(locals.userId)))
	);

	gameRouter.post(
		"/:id/join",
		[protectedRoute],
		handler(({ params, locals }) => {
			const gameId = Number(params.id);
			const server = ORCHESTRATOR.getServerById(gameId);

			if (!server || !server.isJoinableByUser(locals.userId))
				return UserError(`Server pro hru s ID ${gameId} nebyl nalezen.`);

			return Success(server.getJoinInfoForUser(locals.userId));
		})
	);

	gameRouter.post(
		"/:id/pause",
		[protectedRoute],
		handler(async ({ params, locals }) => {
			const gameId = Number(params.id);
			const server = ORCHESTRATOR.getServerById(gameId);

			if (!server || !server.isJoinableByUser(locals.userId))
				return UserError(`Server pro hru s ID ${gameId} nebyl nalezen.`);

			try {
				await server.pause();
			} catch (error) {
				return UserError(
					`Nepodařilo se pozastavit hru: ${error instanceof Error ? error.message : "Neznámá chyba"}`
				);
			}

			return Success({ state: "paused" });
		})
	);

	gameRouter.post(
		"/:id/resume",
		[protectedRoute],
		handler(async ({ params, locals }) => {
			const gameId = Number(params.id);
			const server = ORCHESTRATOR.getServerById(gameId);

			if (!server || !server.isJoinableByUser(locals.userId))
				return UserError(`Server pro hru s ID ${gameId} nebyl nalezen.`);

			try {
				return Success({ state: await server.resume() });
			} catch (error) {
				return UserError(
					`Nepodařilo se obnovit hru: ${error instanceof Error ? error.message : "Neznámá chyba"}`
				);
			}
		})
	);

	return gameRouter;
};
