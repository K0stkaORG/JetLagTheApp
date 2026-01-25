import { NextFunction, Request, Response } from "express";

import { logger } from "~/lib/logger";

export class UserError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UserError";
	}
}

export class AuthenticationError extends Error {
	constructor() {
		super("Authentication error");
		this.name = "AuthenticationError";
	}
}

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
	if (err instanceof UserError) {
		logger.warn(`User error`, {
			service: "REST API",
			path: req.path,
			error: err.message,
		});

		return res.status(400).json({
			status: "user-error",
			message: err.message,
		});
	}

	if (err instanceof AuthenticationError) {
		return res.status(400).json({
			status: "user-error",
			message: err.message,
		});
	}

	if (err instanceof SyntaxError && "body" in err) {
		logger.warn(`Syntax error in request body`, {
			service: "REST API",
			path: req.path,
			error: err.message,
		});

		return res.status(400).json({
			status: "user-error",
			message: "Invalid JSON in request body",
		});
	}

	logger.error(`Unexpected error`, {
		service: "REST API",
		path: req.path,
		stack: err.stack,
	});

	return res.status(500).json({
		status: "internal-error",
		message: "Internal server error",
	});
};
