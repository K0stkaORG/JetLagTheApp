import { Application } from "express";
import { authRouter } from "./auth.routes";
import { lobbyRouter } from "./lobby.routes";
import { logger } from "~/lib/logger";

export function setupRoutes(app: Application): void {
	// API routes
	app.use("/api/auth", authRouter);
	app.use("/api/lobby", lobbyRouter);

	// 404 handler
	app.use("*", (_req, res) => {
		logger.warn("404 - Route not found", {
			service: "REST API",
			path: _req.originalUrl,
		});

		res.status(404).json({
			status: "error",
			message: "Route not found",
		});
	});
}
