import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@jetlag/shared-types";
import { Server as HTTPServer, createServer } from "http";
import express, { Application, json } from "express";

import { Orchestrator } from "./lib/game/orchestrator";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { db } from "./db";
import { errorHandler } from "./rest/middleware/errorHandler";
import helmet from "helmet";
import { logger } from "./lib/logger";
import rateLimit from "express-rate-limit";
import { setupRoutes } from "./rest/routes";
import { setupSocketHandlers } from "./sockets";
import { sql } from "drizzle-orm";

export async function startServer(port: number): Promise<HTTPServer> {
	// Test database connection
	try {
		await db.execute(sql`SELECT NOW()`);
		logger.info("Database connection established");
	} catch (error) {
		logger.error("Failed to connect to database:", error);
		throw error;
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
		logger.error("Failed to initialize Orchestrator:", error);

		throw new Error("Failed to initialize Orchestrator");
	}

	// Error handling middleware (must be last)
	app.use(errorHandler);

	// Start server
	return new Promise((resolve) => httpServer.listen(port, () => resolve(httpServer)));
}
