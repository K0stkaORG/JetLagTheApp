import { createJWT, verifyJWT } from "./jwt";
import { hashPassword, verifyPassword } from "./password";

export const Auth = {
	jwt: {
		create: createJWT,
		verify: verifyJWT,
	},
	password: {
		hash: hashPassword,
		verify: verifyPassword,
	},
};
