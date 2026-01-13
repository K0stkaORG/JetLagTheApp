import { API_RESPONSE_CODE, UserError } from "./apiRouteHandler";

import { ErrorRequestHandler } from "express";

export const syntaxErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
	if (err instanceof SyntaxError && (err as any).status === 400 && "body" in err) {
		res.status(API_RESPONSE_CODE.userError).json(UserError(err.message));
		return;
	}

	next();
};
