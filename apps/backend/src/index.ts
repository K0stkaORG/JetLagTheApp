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
		await Orchestrator.instance.stop("SIGTERM signal received");
	} catch {}

	process.exit(0);
});

process.on("SIGINT", async () => {
	logger.info("SIGINT signal received: closing JetLag server");

	try {
		await Orchestrator.instance.stop("SIGINT signal received");
	} catch {}

	process.exit(0);
});

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

			await server.stop("Fatal error");

			Orchestrator.instance["servers"].delete(affectedGameServerId as number);

			return;
		} else if (affectedGameServerId)
			logger.warn(
				`Failed to access the affected game server #${affectedGameServerId}, escaping to fatal error handling...`,
			);
	}

	logger.error(new ExtendedError("Fatal error occurred, exiting...", { error }));

	try {
		await Orchestrator.instance.stop("Fatal error");
	} catch {}

	process.exit(1);
});
