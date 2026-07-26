import { AdminLoginRequest, RevalidateResponse } from "@jetlag/shared-types";

import { Router } from "express";
import { db, Games } from "~/db";
import { ENV } from "~/env";
import { Auth } from "~/lib/auth";
import { AuthenticationError, UserRequestError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { AdminRouteHandler } from "~/restAPI/middleware/admin";
import { RouteHandler } from "../../middleware/validation";
import { adminDatasetsRouter } from "./admin.dataset.routes";
import { adminGamesRouter } from "./admin.game.routes";
import { adminTelemetryRouter } from "./admin.telemetry.routes";

const adminRouter: Router = Router();

adminRouter.post(
	"/login",
	RouteHandler(AdminLoginRequest, async ({ username, password }) => {
		if (username !== ENV.ADMIN_USERNAME || password !== ENV.ADMIN_PASSWORD)
			throw new UserRequestError("Invalid admin credentials");

		const token = await Auth.jwt.create(0);

		return { result: "success", token };
	}),
);

adminRouter.post(
	"/revalidate",
	AdminRouteHandler(null, async (): Promise<RevalidateResponse> => {
		const token = await Auth.jwt.create(0);

		return {
			token,
		};
	}),
);

adminRouter.get(
	"/resetGames",
	(req, res, next) => {
		const authheader = req.headers.authorization;

		if (!authheader) {
			res.setHeader("WWW-Authenticate", "Basic");
			res.statusCode = 401;
			res.send(new AuthenticationError("").message);

			return;
		}

		const auth = Buffer.from(authheader.split(" ")[1], "base64").toString().split(":");

		if (auth[0] === ENV.ADMIN_USERNAME && auth[1] === ENV.ADMIN_PASSWORD) next();

		res.setHeader("WWW-Authenticate", "Basic");
		res.statusCode = 401;
		res.send(new AuthenticationError("").message);
		return;
	},
	RouteHandler(null, async () => {
		logger.warn("Deleting all games from the database");

		await db.delete(Games);

		logger.info("All games deleted successfully, restarting the server...");

		process.exit(0);
	}),
);

adminRouter.use("/games", adminGamesRouter);
adminRouter.use("/datasets", adminDatasetsRouter);
adminRouter.use("/telemetry", adminTelemetryRouter);

export { adminRouter };
