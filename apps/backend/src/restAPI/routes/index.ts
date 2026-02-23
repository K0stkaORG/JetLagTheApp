import express, { Application } from "express";
import path from "path";
import { ENV } from "~/env";
import { logger } from "~/lib/logger";
import { adminRouter } from "./admin/admin.routes";
import { authRouter } from "./auth.routes";
import { datasetRouter } from "./dataset.routes";
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

	// 404 handler
	app.use("*", (req, res) => {
		logger.warn(`Route ${req.originalUrl} not found`);

		res.status(404).json({
			status: "error",
			message: "Route not found",
		});
	});
}
