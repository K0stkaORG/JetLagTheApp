// src/db/connector.ts

import * as relations from "./relations";
import * as schema from "./models";

import { ENV } from "~/env";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

export const pool = new pg.Pool({
	connectionString: ENV.DATABASE_URL,
});

export const db = drizzle(pool, { schema: { ...schema, ...relations } });
