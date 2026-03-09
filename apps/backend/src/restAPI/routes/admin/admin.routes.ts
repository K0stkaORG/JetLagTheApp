import { AdminLoginRequest, RevalidateResponse } from "@jetlag/shared-types";

import { Router } from "express";
import { ENV } from "~/env";
import { Auth } from "~/lib/auth";
import { UserRequestError } from "~/lib/errors";
import { AdminRouteHandler } from "~/restAPI/middleware/admin";
import { RouteHandler } from "../../middleware/validation";
import { adminDatasetsRouter } from "./admin.dataset.routes";
import { adminGamesRouter } from "./admin.game.routes";

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

adminRouter.use("/games", adminGamesRouter);
adminRouter.use("/datasets", adminDatasetsRouter);

export { adminRouter };
