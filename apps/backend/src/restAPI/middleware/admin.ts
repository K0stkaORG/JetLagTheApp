import { NextFunction, Request, Response } from "express";
import z, { ZodType } from "zod";

import { Auth } from "~/lib/auth";
import { AuthenticationError } from "./errorHandler";
import { RouteHandler } from "./validation";
import { logger } from "~/lib/logger";

export const AdminRouteHandler = <Schema extends ZodType | null, ResponseType>(
	requestSchema: Schema,
	handler: (
		data: Schema extends ZodType ? z.infer<Schema> : null,
		req: Request,
		res: Response<ResponseType>,
	) => Promise<ResponseType> | ResponseType,
): ((req: Request, res: Response, next: NextFunction) => void) =>
	RouteHandler(requestSchema, async (data, req, res) => {
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			logger.warn("Received request to admin route without authorization token", {
				path: req.path,
				ip: req.ip,
			});

			throw new AuthenticationError();
		}

		const userId = await Auth.jwt.verify(token);

		if (userId !== 0) {
			logger.warn("Received request to admin route with invalid authorization token", {
				path: req.path,
				ip: req.ip,
			});

			throw new AuthenticationError();
		}

		return handler(data, req, res);
	});
