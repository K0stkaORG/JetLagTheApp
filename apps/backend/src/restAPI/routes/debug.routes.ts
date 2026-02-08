import { DatasetMetadata, Datasets, Games, Users, db, eq } from "~/db";

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

			await Orchestrator.instance.restart();

			let userId = await db.query.Users.findFirst({
				where: eq(Users.nickname, "test"),
				columns: { id: true },
			}).then((user) => user?.id);

			if (!userId) {
				userId = await db
					.insert(Users)
					.values({
						nickname: "test",
						passwordHash: await Auth.password.hash("test"),
						colors: getUserColors("test"),
					})
					.returning({ id: Users.id })
					.then((res) => res[0].id);
			}

			let userId2 = await db.query.Users.findFirst({
				where: eq(Users.nickname, "test2"),
				columns: { id: true },
			}).then((user) => user?.id);

			if (!userId2) {
				userId2 = await db
					.insert(Users)
					.values({
						nickname: "test2",
						passwordHash: await Auth.password.hash("test"),
						colors: getUserColors("test2"),
					})
					.returning({ id: Users.id })
					.then((res) => res[0].id);
			}

			let datasetMetadataId = await db.query.DatasetMetadata.findFirst({
				where: eq(DatasetMetadata.gameType, "roundabout"),
				columns: { id: true },
			}).then((datasetMetadata) => datasetMetadata?.id);

			if (!datasetMetadataId) {
				datasetMetadataId = await db
					.insert(DatasetMetadata)
					.values({
						name: "Roundabout Dataset",
						gameType: "roundabout",
					})
					.returning({ id: DatasetMetadata.id })
					.then((res) => res[0].id);
			}

			let datasetId = await db.query.Datasets.findFirst({
				where: eq(Datasets.metadataId, datasetMetadataId!),
				columns: { id: true },
			}).then((dataset) => dataset?.id);

			if (!datasetId) {
				datasetId = await db
					.insert(Datasets)
					.values({
						version: 1,
						latest: true,
						metadataId: datasetMetadataId!,
						data: {},
					})
					.returning({ id: Datasets.id })
					.then((res) => res[0].id);
			}

			const game1Id = await Orchestrator.instance.scheduleNewGame({
				startAt: new Date(Date.now() + ENV.START_SERVER_LEAD_TIME_MIN * 60_000 + 10_000),
				datasetId: datasetId!,
				type: "roundabout",
			});

			const game2Id = await Orchestrator.instance.scheduleNewGame({
				startAt: new Date(Date.now() + 10_000),
				datasetId: datasetId!,
				type: "hideAndSeek",
			});

			await Orchestrator.instance.addPlayerToGame(game1Id, userId!);
			await Orchestrator.instance.addPlayerToGame(game2Id, userId!);

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

		return Orchestrator.instance.getLobbyForUser(testUserId);
	}),
);

debugRouter.get(
	"/dump-servers",
	RouteHandler(null, async () => {
		return Orchestrator.instance["servers"].map((server) => ({
			game: server.game,
			players: server.players.map((p) => ({
				user: p.user,
				cords: p.cords,
				lastUpdated: p["_lastCordsUpdate"],
				isOnline: p.isOnline,
				socketId: p["socket"]?.id,
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
		for await (const server of Orchestrator.instance["servers"].filter((s) => s.timeline.phase === "in-progress"))
			await server.timeline.pause();

		return { result: "success" };
	}),
);

debugRouter.get(
	"/resume-all",
	RouteHandler(null, async () => {
		for await (const server of Orchestrator.instance["servers"].filter((s) => s.timeline.phase === "paused"))
			await server.timeline.resume();

		return { result: "success" };
	}),
);

export { debugRouter };
