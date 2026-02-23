import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@jetlag/shared-types";
import express, { Application, json } from "express";
import { Server as HTTPServer, createServer } from "http";

import cors from "cors";
import { sql } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Server as SocketIOServer } from "socket.io";
import { db } from "./db";
import { ExtendedError } from "./lib/errors";
import { Orchestrator } from "./lib/game/orchestrator/orchestrator";
import { logger } from "./lib/logger";
import { errorHandler } from "./restAPI/middleware/errorHandler";
import { setupRoutes } from "./restAPI/routes";
import { setupSocketHandlers } from "./socket";

export async function startServer(port: number): Promise<HTTPServer> {
	// Test database connection
	try {
		await db.execute(sql`SELECT NOW()`);
		logger.info("Database connection established");
	} catch (error) {
		throw new ExtendedError("Failed to establish connection to the database", { error });
	}

	// Create HTTP and Socket.IO servers
	const app: Application = express();
	const httpServer: HTTPServer = createServer(app);
	const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
		httpServer,
		{
			cors: {
				origin: "*",
			},
		},
	);

	// Security middleware
	app.use(helmet());
	app.use(cors());

	// Rate limiting
	const limiter = rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 100, // Limit each IP to 100 requests per windowMs
		standardHeaders: true,
		legacyHeaders: false,
	});
	app.use("/api/", limiter as unknown as express.RequestHandler);

	// Body parsing middleware
	app.use(json({ limit: "10mb" }));

	// Health check endpoint
	app.get("/health", (_req, res) => {
		res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
	});

	// Setup routes
	setupRoutes(app);

	// Setup Socket.IO handlers
	setupSocketHandlers(io);

	// Load initial server state (e.g. restore active games)
	try {
		await Orchestrator.initialize(io);
	} catch (error) {
		throw new ExtendedError("Failed to initialize Orchestrator", { error, service: "orchestrator" });
	}

	// Error handling middleware (must be last)
	app.use(errorHandler);

	// Start server
	return new Promise((resolve, reject) => {
		httpServer.listen(port, () => resolve(httpServer));

		// Handle server startup error
		httpServer.on("error", (error: { code?: string }) => {
			if (error.code === "EADDRINUSE")
				reject(new ExtendedError(`Port ${port} is already in use. Please choose a different port.`, {}));
			else reject(new ExtendedError(`Failed to start server`, { error }));
		});
	});
}
