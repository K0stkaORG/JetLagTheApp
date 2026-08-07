import { Router } from "express";
import { db, Games } from "~/db";
import { ENV } from "~/env";
import { AuthenticationError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { Orchestrator } from "~/lib/orchestrator/orchestrator";
import { RouteHandler } from "../../middleware/validation";
import { adminAuthRouter } from "./admin.auth.routes";
import { adminDatasetsRouter } from "./admin.dataset.routes";
import { adminGamesRouter } from "./admin.game.routes";
import { adminTelemetryRouter } from "./admin.telemetry.routes";
import { adminUsersRouter } from "./admin.users.routes";

const adminRouter: Router = Router();

adminRouter.get(
	"/resetGames",

	(req, res, next) => {
		const unauthorized = () => {
			res.setHeader("WWW-Authenticate", "Basic");
			res.statusCode = 401;
			res.send(new AuthenticationError("").message);
		};

		const authHeader = req.headers.authorization;

		if (!authHeader) return unauthorized();

		const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");

		if (auth[0] === ENV.ADMIN_USERNAME && auth[1] === ENV.ADMIN_PASSWORD) next();
		else unauthorized();
	},

	RouteHandler(null, async (_, __, res) => {
		logger.warn("Deleting all games from the database");

		await db.delete(Games);

		logger.info("All games deleted successfully, restarting the server...");

		await Orchestrator.instance.restart();

		res.redirect("/");
	}),
);

adminRouter.use("/", adminAuthRouter);
adminRouter.use("/games", adminGamesRouter);
adminRouter.use("/datasets", adminDatasetsRouter);
adminRouter.use("/users", adminUsersRouter);
adminRouter.use("/telemetry", adminTelemetryRouter);

export { adminRouter };
