import { SignJWT, jwtVerify } from "jose";

import { User } from "@jetlag/shared-types";
import { env } from "~/env";

export const createJWT = (userId: User["id"]): Promise<string> =>
	new SignJWT({ userId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(env.SECRET_KEY);

export const verifyJWT = async (token: string): Promise<User["id"] | null> =>
	await jwtVerify(token, env.SECRET_KEY, {
		algorithms: ["HS256"],
	})
		.then((result) => result.payload.userId as User["id"])
		.catch(() => null);
