import { Request, RequestHandler, Response } from "express";

import { io } from "./io";
import { z } from "zod/v4";

type SuccessResponse = {
	result: "success";
	data: any;
};

type UserErrorResponse = {
	result: "user-error";
	error: string;
};

type ServerErrorResponse = {
	result: "server-error";
	error: string;
};

type CustomResponseGenerator = {
	result: "custom";
	generator: (res: Response) => void;
};

export type APIResponse = SuccessResponse | UserErrorResponse | ServerErrorResponse | CustomResponseGenerator;

export const API_RESPONSE_CODE = {
	success: 200,
	userError: 400,
	serverError: 500,
} as const;

export const handler =
	<T extends z.Schema>(
		callback: T extends undefined
			? (req: {
					body: Request["body"];
					data: undefined;
					locals: Response["locals"];
					params: Request["params"];
			  }) => Promise<APIResponse> | APIResponse
			: (req: {
					body: Request["body"];
					data: z.infer<T>;
					locals: Response["locals"];
					params: Request["params"];
			  }) => Promise<APIResponse> | APIResponse,
		requestSchema?: T
	): RequestHandler =>
	async (req, res) => {
		let response: APIResponse;

		const parsed = requestSchema?.safeParse(req.body) ?? { success: true, data: undefined };

		if (parsed.success) {
			try {
				response = await callback({
					body: req.body,
					data: parsed.data,
					locals: res.locals,
					params: req.params,
				});
			} catch (error) {
				response = ServerError(
					"An unexpected error occurred:\n" + (error instanceof Error ? error.message : String(error))
				);

				io.error(
					"An unexpected error occurred while processing a request",
					"",
					`Request URL: ${req.originalUrl}`,
					`Request Body: ${JSON.stringify(req.body)}`,
					"",
					error instanceof Error ? error.stack : String(error)
				);
			}
		} else {
			response = UserError(parsed.error.issues[0].message);

			io.warn("Invalid request body structure:", "", z.prettifyError(parsed.error), "", req.body);
		}

		try {
			switch (response.result) {
				case "success":
					res.status(API_RESPONSE_CODE.success).json(response);
					break;
				case "user-error":
					res.status(API_RESPONSE_CODE.userError).json(response);
					break;
				case "server-error":
					res.status(API_RESPONSE_CODE.serverError).json(response);
					break;
				case "custom":
					response.generator(res);
					break;
				default:
					res.status(API_RESPONSE_CODE.serverError).json(
						ServerError(`Unknown response type ${(response as any).result}`)
					);
					break;
			}
		} catch (error) {
			io.error(
				"An error occurred while sending the response",
				"",
				`Request URL: ${req.originalUrl}`,
				"",
				error instanceof Error ? error.stack : String(error)
			);

			res.status(API_RESPONSE_CODE.serverError).json(
				ServerError("An error occurred while sending the response.")
			);
		}
	};

export const Success = (data?: any): SuccessResponse => ({
	result: "success",
	data,
});

export const UserError = (message?: string): UserErrorResponse => ({
	result: "user-error",
	error: message || "There was an error with your request.",
});

export const ServerError = (message?: string): ServerErrorResponse => ({
	result: "server-error",
	error: message || "There was an error processing your request.",
});

export const CustomResponse = (generator: (res: Response) => void): CustomResponseGenerator => ({
	result: "custom",
	generator,
});
