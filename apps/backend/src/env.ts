import "dotenv/config";

import { createSecretKey } from "crypto";
import { z } from "zod/v4";

export const env = z
	.object({
		SECRET_KEY: z
			.string()
			.readonly()
			.transform((secret) => createSecretKey(secret, "utf-8")),
		DATABASE_URL: z.string().readonly(),
		SERVER_PORT: z.coerce.number().readonly(),
		WS_PORT: z.coerce.number().readonly(),
	})
	.parse(process.env);
