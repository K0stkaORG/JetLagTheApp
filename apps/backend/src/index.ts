import { ENV } from "~/env";
import { logger } from "./lib/logger";
import { startServer } from "./server";

logger.info(`Starting server in ${ENV.NODE_ENV} mode`);

// Start the server
startServer(ENV.SERVER_PORT)
	.then(() => {
		logger.info(`JetLag server started successfully on port ${ENV.SERVER_PORT}`);
	})
	.catch((error) => {
		logger.error("Failed to start JetLag server:", error);
		process.exit(1);
	});

// Handle graceful shutdown
process.on("SIGTERM", () => {
	logger.info("SIGTERM signal received: closing JetLag server");
	process.exit(0);
});

process.on("SIGINT", () => {
	logger.info("SIGINT signal received: closing JetLag server");
	process.exit(0);
});
