import express, { Application } from "express";
import path from "path";
import { ENV } from "~/env";
import { logger } from "~/lib/logger";
import { adminRouter } from "./admin/admin.routes";
import { authRouter } from "./auth.routes";
import { datasetRouter } from "./dataset.routes";
import { debugRouter } from "./debug.routes";
import { lobbyRouter } from "./lobby.routes";

const AdminPanelPath = ENV.NODE_ENV === "production" ? "../../admin-panel/dist" : "../../../../admin-panel/dist";

export function setupRoutes(app: Application): void {
	// Serve admin panel static files
	app.use("/panel/*", express.static(path.join(__dirname, AdminPanelPath, "index.html")));
	app.use(express.static(path.join(__dirname, AdminPanelPath)));

	// API routes
	app.use("/api/auth", authRouter);
	app.use("/api/lobby", lobbyRouter);
	app.use("/api/dataset", datasetRouter);
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
