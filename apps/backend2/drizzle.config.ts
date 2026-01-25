import "dotenv/config";

import { defineConfig } from "drizzle-kit";
import { env } from "process";

if (!env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
	schema: "./src/db/models.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
});
