import "dotenv/config";

import { createSecretKey } from "crypto";
import { z } from "zod";

export const ENV = [
	z
		.object({
			NODE_ENV: z.enum(["development", "production"]).readonly().default("development"),

			SECRET_KEY: z
				.string()
				.readonly()
				.transform((secret) => createSecretKey(secret, "utf-8")),
			DATABASE_URL: z.string().readonly(),
			SERVER_PORT: z.coerce.number().readonly().default(3000),

			RESTART_GAME_SERVER_AFTER_CRASH: z.boolean().default(true),
			RESTART_GAME_SERVER_TIMEOUT_S: z.number().default(60),

			ADMIN_USERNAME: z.string().min(5).readonly(),
			ADMIN_PASSWORD: z.string().min(5).readonly(),

			START_SERVER_LEAD_TIME_MIN: z.coerce.number().min(0).readonly().default(10),

			CORDS_STALE_INTERVAL_S: z.coerce.number().min(30).readonly().default(60),
		})
		.safeParse(process.env),
].map((result) => {
	if (!result.success) {
		console.error("Environment variable validation failed:", result.error.issues);
		process.exit(1);
	}

	return result.data;
});
