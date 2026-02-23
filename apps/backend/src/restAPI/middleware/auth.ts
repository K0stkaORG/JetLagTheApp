import { NextFunction, Request, Response } from "express";
import z, { ZodType } from "zod";

import { User } from "@jetlag/shared-types";
import { Auth } from "~/lib/auth";
import { AuthenticationError } from "~/lib/errors";
import { RouteHandler } from "./validation";

export const ProtectedRouteHandler = <Schema extends ZodType | null, ResponseType>(
	requestSchema: Schema,
	handler: (
		userId: User["id"],
		data: Schema extends ZodType ? z.infer<Schema> : null,
		req: Request,
		res: Response<ResponseType>,
	) => Promise<ResponseType> | ResponseType,
): ((req: Request, res: Response, next: NextFunction) => void) =>
	RouteHandler(requestSchema, async (data, req, res) => {
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) throw new AuthenticationError(req.ip ?? "unknown");

		const userId = await Auth.jwt.verify(token);

		if (!userId) throw new AuthenticationError(req.ip ?? "unknown");

		return handler(userId, data, req, res);
	});
