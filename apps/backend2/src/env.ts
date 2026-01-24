import "dotenv/config";

import { createSecretKey } from "crypto";
import { z } from "zod";

export const env = z
	.object({
		NODE_ENV: z.enum(["development", "production"]).readonly().default("development"),

		SECRET_KEY: z
			.string()
			.readonly()
			.transform((secret) => createSecretKey(secret, "utf-8")),
		DATABASE_URL: z.string().readonly(),
		SERVER_PORT: z.coerce.number().readonly().default(3000),

		START_SERVER_LEAD_TIME_MIN: z.coerce.number().min(0).readonly().default(10),
	})
	.parse(process.env);
