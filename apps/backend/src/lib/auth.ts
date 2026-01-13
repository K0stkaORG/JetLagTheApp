import { API_RESPONSE_CODE, UserError } from "~/lib/apiRouteHandler";
import { SignJWT, jwtVerify } from "jose";

import { RequestHandler } from "express";
import { env } from "~/env";

export const generateJWT = (userId: number) => new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(env.SECRET_KEY);

export const verifyJWT = async (token: string) =>
	await jwtVerify(token, env.SECRET_KEY, {
		algorithms: ["HS256"],
	})
		.then((result) => result.payload.userId as number)
		.catch(() => null);

export const protectedRoute: RequestHandler = async (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		res.status(API_RESPONSE_CODE.userError).json(UserError("K zobrazení daného obsahu je potřeba se přihlásit"));
		return;
	}

	const userId = await verifyJWT(token);

	if (!userId) {
		res.status(API_RESPONSE_CODE.userError).json(UserError("K zobrazení daného obsahu je potřeba se přihlásit"));
		return;
	}

	res.locals.userId = userId;

	next();
};
