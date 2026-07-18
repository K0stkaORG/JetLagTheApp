import { NextFunction, Request, Response } from "express";
import { ExtendedError, UserRequestError } from "~/lib/errors";

import { logger } from "~/lib/logger";

export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction) => {
	if (error instanceof UserRequestError) {
		logger.warn(new ExtendedError("Route handler thrown a UserRequestError", { error, service: "restAPI", path: req.path }));

		return res.status(400).json(error.message);
	}

	if (error instanceof SyntaxError && "body" in error) {
		logger.warn(
			new ExtendedError("Invalid JSON in request body", { error, service: "restAPI", path: req.path }),
		);

		return res.status(400).json("Invalid JSON in request body");
	}

	logger.error(
		new ExtendedError("Error when executing route handler", { error, service: "restAPI", path: req.path }),
	);

	return res.status(500).json("Internal server error");
};
