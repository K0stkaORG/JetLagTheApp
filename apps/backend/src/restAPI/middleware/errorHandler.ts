import { NextFunction, Request, Response } from "express";
import { ExtendedError, UserRequestError } from "~/lib/errors";

import { logger } from "~/lib/logger";

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
	if (err instanceof UserRequestError) {
		logger.warn(new ExtendedError(err.message, { error: err, service: "restAPI", path: req.path }));

		return res.status(400).json(err.message);
	}

	if (err instanceof SyntaxError && "body" in err) {
		logger.warn(
			new ExtendedError("Invalid JSON in request body", { error: err, service: "restAPI", path: req.path }),
		);

		return res.status(400).json("Invalid JSON in request body");
	}

	logger.error(
		new ExtendedError("Error when executing route handler", { error: err, service: "restAPI", path: req.path }),
	);

	return res.status(500).json("Internal server error");
};
