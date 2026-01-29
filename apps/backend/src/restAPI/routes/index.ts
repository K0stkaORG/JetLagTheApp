import { Application } from "express";
import { ENV } from "~/env";
import { adminRouter } from "./admin/admin.routes";
import { authRouter } from "./auth.routes";
import { debugRouter } from "./debug.routes";
import express from "express";
import { lobbyRouter } from "./lobby.routes";
import { logger } from "~/lib/logger";
import path from "path";

const AdminPanelPath = ENV.NODE_ENV === "production" ? "../../admin-panel/dist" : "../../../../admin-panel/dist";

export function setupRoutes(app: Application): void {
	// Serve admin panel static files
	app.use("/panel/*", express.static(path.join(__dirname, AdminPanelPath, "index.html")));
	app.use(express.static(path.join(__dirname, AdminPanelPath)));

	// API routes
	app.use("/api/auth", authRouter);
	app.use("/api/lobby", lobbyRouter);
	app.use("/api/admin", adminRouter);
	app.use("/api/debug", debugRouter);

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
