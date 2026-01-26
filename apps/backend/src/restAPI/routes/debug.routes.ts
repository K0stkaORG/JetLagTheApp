import { Games, Users, db, eq } from "~/db";

import { Auth } from "~/lib/auth";
import { ENV } from "~/env";
import { Orchestrator } from "~/lib/game/orchestrator/orchestrator";
import { RouteHandler } from "../middleware/validation";
import { Router } from "express";
import { UserError } from "../middleware/errorHandler";
import { getUserColors } from "~/lib/branding/colors";

const debugRouter: Router = Router();

debugRouter.get(
	"/seed",
	RouteHandler(null, async () => {
		{
			await db.delete(Games);

			await db.delete(Users);

			await Orchestrator.instance.restart();

			const userId = await db
				.insert(Users)
				.values({
					nickname: "test",
					passwordHash: await Auth.password.hash("test"),
					colors: getUserColors("test"),
				})
				.returning({ id: Users.id })
				.then((res) => res[0].id);

			const gameId = await Orchestrator.instance.scheduleNewGame({
				startAt: new Date(Date.now() + ENV.START_SERVER_LEAD_TIME_MIN * 60_000 + 10_000),
				type: "roundabout",
			});

			await Orchestrator.instance.addUserAccessToGame(gameId, userId);

			const gameId2 = await Orchestrator.instance.scheduleNewGame({
				startAt: new Date(Date.now() + 10_000),
				type: "hideAndSeek",
			});

			await Orchestrator.instance.addUserAccessToGame(gameId2, userId);

			return {
				result: "success",
			};
		}
	}),
);

debugRouter.get(
	"/dump-lobby",
	RouteHandler(null, async () => {
		const testUserId = await db.query.Users.findFirst({
			where: eq(Users.nickname, "test"),
			columns: { id: true },
		}).then((user) => user?.id);

		if (!testUserId) throw new UserError("Test user not found");

		return Orchestrator.instance.getJoinAdvertisementsForUser(testUserId);
	}),
);

debugRouter.get(
	"/dump-servers",
	RouteHandler(null, async () => {
		return Array.from(Orchestrator.instance["gameServers"].values()).map((server) => ({
			game: server?.game,
			players: Array.from(server?.players?.values()).map((p) => ({
				user: p.user,
				cords: p.cords,
				lastUpdated: p["_lastCordsUpdate"],
			})),
			timeline: {
				sessions: server.timeline["sessions"],
				gameTime: server.timeline.gameTime,
				isPaused: server.timeline.phase,
				currentSession: server.timeline["currentSession"],
			},
		}));
	}),
);

debugRouter.get(
	"/pause-all",
	RouteHandler(null, async () => {
		for await (const server of Orchestrator.instance["gameServers"].values())
			if (server.timeline.phase === "in-progress") await server.timeline.pause();

		return { result: "success" };
	}),
);

debugRouter.get(
	"/resume-all",
	RouteHandler(null, async () => {
		for await (const server of Orchestrator.instance["gameServers"].values())
			if (server.timeline.phase === "paused") await server.timeline.resume();

		return { result: "success" };
	}),
);

export { debugRouter };
