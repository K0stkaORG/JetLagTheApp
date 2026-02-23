/* eslint-disable no-empty */
import { ENV } from "~/env";
import { ExtendedError } from "./lib/errors";
import { Orchestrator } from "./lib/game/orchestrator/orchestrator";
import { logger } from "./lib/logger";
import { startServer } from "./start";

logger.info(`Starting server in ${ENV.NODE_ENV} mode`);

// Start the server
startServer(ENV.SERVER_PORT)
	.then(() => {
		logger.info(`JetLag server started successfully on port ${ENV.SERVER_PORT}`);
	})
	.catch((error) => {
		logger.error(new ExtendedError("Failed to start JetLag server", { error }));

		process.exit(1);
	});

// Handle graceful shutdown
process.on("SIGTERM", async () => {
	logger.info("SIGTERM signal received: closing JetLag server");

	try {
		await Orchestrator.instance.stop();
	} catch {}

	process.exit(0);
});

process.on("SIGINT", async () => {
	logger.info("SIGINT signal received: closing JetLag server");

	try {
		await Orchestrator.instance.stop();
	} catch {}

	process.exit(0);
});
