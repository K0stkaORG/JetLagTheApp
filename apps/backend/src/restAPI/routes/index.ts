import express, { Application } from "express";
import path from "path";
import { ENV } from "~/env";
import { logger } from "~/lib/logger";
import { adminRouter } from "./admin/admin.routes";
import { authRouter } from "./auth.routes";
import { datasetRouter } from "./dataset.routes";
import { lobbyRouter } from "./lobby.routes";
import { testRouter } from "./test.routes";

const AdminPanelPath = ENV.NODE_ENV === "production" ? "../../admin-panel/dist" : "../../../../admin-panel/dist";

export function setupRoutes(app: Application): void {
	const staticPath = path.resolve(__dirname, AdminPanelPath);

	// Serve admin panel static files with no-cache headers for SW files
	app.use(
		express.static(staticPath, {
			setHeaders: (res, filePath) => {
				if (filePath.endsWith("sw.js") || filePath.endsWith("registerSW.js"))
					res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
			},
		}),
	);

	// SPA fallback for panel routes
	app.get("/panel/*", (_req, res) => {
		res.sendFile(path.join(staticPath, "index.html"));
	});

	// Health check route
	app.get("/api/isJetlagServer", (_req, res) => {
		res.json({
			isJetlagServer: true,
		});
	});

	// API routes
	app.use("/api/auth", authRouter);
	app.use("/api/lobby", lobbyRouter);
	app.use("/api/dataset", datasetRouter);
	app.use("/api/admin", adminRouter);

	app.use("/test", testRouter);

	// 404 handler
	app.use("*", (req, res) => {
		logger.warn(`Route ${req.originalUrl} not found`);

		res.status(404).json({
			message: "Route not found",
		});
	});
}
