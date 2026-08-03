import { AdminLoginRequest, RevalidateResponse } from "@jetlag/shared-types";

import { Router } from "express";
import { ENV } from "~/env";
import { Auth } from "~/lib/auth";
import { UserRequestError } from "~/lib/errors";
import { AdminRouteHandler } from "~/restAPI/middleware/admin";
import { RouteHandler } from "../../middleware/validation";

const adminAuthRouter: Router = Router();

adminAuthRouter.post(
	"/login",
	RouteHandler(AdminLoginRequest, async ({ username, password }) => {
		if (username !== ENV.ADMIN_USERNAME || password !== ENV.ADMIN_PASSWORD)
			throw new UserRequestError("Invalid admin credentials");

		const token = await Auth.jwt.create(0);

		return { result: "success", token };
	}),
);

adminAuthRouter.post(
	"/revalidate",
	AdminRouteHandler(null, async (): Promise<RevalidateResponse> => {
		const token = await Auth.jwt.create(0);

		return {
			token,
		};
	}),
);

export { adminAuthRouter };
