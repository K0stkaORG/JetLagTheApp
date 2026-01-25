import { NextFunction, Request, Response } from "express";
import z, { ZodType } from "zod";

import { UserError } from "./errorHandler";

export const RouteHandler = <Schema extends ZodType | null, ResponseType>(
	requestSchema: Schema,
	handler: (
		data: Schema extends ZodType ? z.infer<Schema> : null,
		req: Request,
		res: Response<ResponseType>,
	) => Promise<ResponseType> | ResponseType,
): ((req: Request, res: Response, next: NextFunction) => void) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const validationResult = requestSchema
			? requestSchema.safeParse(req.body)
			: ({ success: true, data: null } as z.ZodSafeParseSuccess<any>);

		if (!validationResult.success)
			return next(new UserError(validationResult.error.issues[0]?.message || "Validation failed"));

		try {
			const result = await handler(validationResult.data, req, res);

			return res.json(result);
		} catch (err) {
			return next(err);
		}
	};
};
