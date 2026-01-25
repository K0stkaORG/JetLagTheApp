// src/db/connector.ts

import * as relations from "./relations";
import * as schema from "./schema";

import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "~/env";
import pg from "pg";

export const pool = new pg.Pool({
	connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema: { ...schema, ...relations } });
