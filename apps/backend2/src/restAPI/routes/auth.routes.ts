import {
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	RegisterResponse,
	RevalidateResponse,
} from "@jetlag/shared-types";
import { Users, db } from "~/db";

import { Auth } from "~/lib/auth";
import { ProtectedRouteHandler } from "../middleware/auth";
import { RouteHandler } from "../middleware/validation";
import { Router } from "express";
import { UserError } from "../middleware/errorHandler";
import { eq } from "drizzle-orm";
import { getUserColors } from "~/lib/branding/colors";
import { logger } from "~/lib/logger";
import z from "zod";

const authRouter: Router = Router();

authRouter.post(
	"/login",
	RouteHandler(LoginRequest, async ({ nickname, password }): Promise<LoginResponse> => {
		const user = await db.query.Users.findFirst({
			where: eq(Users.nickname, nickname),
		});

		if (!user || !(await Auth.password.verify(password, user.passwordHash)))
			throw new UserError("Invalid credentials");

		const token = await Auth.jwt.create(user.id);

		return {
			result: "success",
			token,
			user: {
				id: user.id,
				nickname: user.nickname,
				colors: user.colors,
			},
		};
	}),
);

authRouter.post(
	"/register",
	RouteHandler(RegisterRequest, async ({ nickname, password }): Promise<RegisterResponse> => {
		const existingUser = await db.query.Users.findFirst({
			where: eq(Users.nickname, nickname),
			columns: {
				id: true,
			},
		});

		if (existingUser) throw new UserError("Nickname is already taken");

		const passwordHash = await Auth.password.hash(password);

		const colors = getUserColors(nickname);

		const insertedUser = await db
			.insert(Users)
			.values({
				nickname,
				passwordHash,
				colors,
			})
			.returning()
			.then((result) => result[0]);

		logger.info("New user registered:", { userId: insertedUser.id, nickname });
	}),
);

authRouter.post(
	"/revalidate",
	ProtectedRouteHandler(z.any(), async (userId): Promise<RevalidateResponse> => {
		const token = await Auth.jwt.create(userId);

		return {
			token,
		};
	}),
);

export { authRouter };
