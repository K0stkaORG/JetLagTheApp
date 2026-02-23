// src/db/connector.ts

import * as schema from "./models";
import * as relations from "./relations";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { ENV } from "~/env";

export const pool = new pg.Pool({
	connectionString: ENV.DATABASE_URL,
});

export const db = drizzle(pool, { schema: { ...schema, ...relations } });
