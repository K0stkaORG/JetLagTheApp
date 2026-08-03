import { AdminUsersListResponse } from "@jetlag/shared-types";
import { Router } from "express";
import { db } from "~/db";
import { AdminRouteHandler } from "~/restAPI/middleware/admin";

const adminUsersRouter: Router = Router();

adminUsersRouter.get(
	"/list",
	AdminRouteHandler(
		null,
		(): Promise<AdminUsersListResponse> =>
			db.query.Users.findMany({
				columns: {
					id: true,
					nickname: true,
					colors: true,
				},
			}),
	),
);

export { adminUsersRouter };
