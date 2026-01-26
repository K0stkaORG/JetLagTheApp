import { SignJWT, jwtVerify } from "jose";

import { ENV } from "~/env";
import { User } from "@jetlag/shared-types";

export const createJWT = (userId: User["id"]): Promise<string> =>
	new SignJWT({ userId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(ENV.SECRET_KEY);

export const verifyJWT = async (token: string): Promise<User["id"] | null> =>
	await jwtVerify(token, ENV.SECRET_KEY, {
		algorithms: ["HS256"],
	})
		.then((result) => result.payload.userId as User["id"])
		.catch(() => null);
