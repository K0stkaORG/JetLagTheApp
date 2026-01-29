import { AdminLoginRequest } from "@jetlag/shared-types";
import { Auth } from "~/lib/auth";
import { ENV } from "~/env";
import { RouteHandler } from "../../middleware/validation";
import { Router } from "express";
import { UserError } from "../../middleware/errorHandler";
import { adminGamesRouter } from "./admin.game.routes";

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

adminRouter.use("/games", adminGamesRouter);

export { adminRouter };
