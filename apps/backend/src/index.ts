/* eslint-disable no-empty */
import { enablePatches } from "immer";
import "source-map-support/register";
import { ENV } from "~/env";
import { ExtendedError } from "./lib/errors";
import { logger } from "./lib/logger";
import { Orchestrator } from "./lib/orchestrator/orchestrator";
import { startServer } from "./start";

logger.info(`Starting server in ${ENV.NODE_ENV} mode`);

// Enable patches for immer
enablePatches();

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

	await Orchestrator.instance
		.stop("SIGTERM signal received")
		.catch((error) => logger.error(new ExtendedError("Error occurred when stopping down orchestrator", { error })));

	process.exit(0);
});

process.on("SIGINT", async () => {
	logger.info("SIGINT signal received: closing JetLag server");

	await Orchestrator.instance
		.stop("SIGINT signal received")
		.catch((error) => logger.error(new ExtendedError("Error occurred when stopping down orchestrator", { error })));

	process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
	if (error instanceof ExtendedError) {
		const affectedGameServerId = error.isolateAffectedGameServer();
		const server = affectedGameServerId
			? Orchestrator["singletonInstance"]?.getServer(affectedGameServerId)
			: undefined;

		if (server) {
			logger.error(
				new ExtendedError("Fatal error occurred - killing affected game server", {
					error,
					service: "gameServer",
					gameServer: server!,
				}),
			);

			await Orchestrator.instance.killServer(affectedGameServerId as number, "Fatal error");

			return;
		} else if (affectedGameServerId)
			logger.warn(
				`Failed to access the affected game server #${affectedGameServerId}, escaping to fatal error handling...`,
			);
	}

	logger.error(new ExtendedError("Fatal error occurred, exiting...", { error }));

	await Orchestrator.instance
		.stop("Fatal error")
		.catch((error) => logger.error(new ExtendedError("Error occurred when stopping down orchestrator", { error })));

	process.exit(1);
});
