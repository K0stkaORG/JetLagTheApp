import "dotenv/config";

import { db, pool } from "./db/connector";

import { migrate } from "drizzle-orm/node-postgres/migrator";

// This will run migrations on the database, skipping the ones already applied
async function main() {
	console.log("Running migrations...");
	await migrate(db, { migrationsFolder: "./drizzle" });
	console.log("Migrations completed successfully.");

	// Don't forget to close the connection, otherwise the script will hang
	await pool.end();
}

main().catch((err) => {
	console.error("Migration failed!");
	console.error(err);

	process.exit(1);
});
