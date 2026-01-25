import { AppServer, AppSocket } from "~/lib/types";

import { logger } from "~/lib/logger";

export function setupSocketHandlers(io: AppServer): void {
	io.on("connection", (socket: AppSocket) => {
		logger.info("Client connected", { socketId: socket.id });

		// Join a game
		socket.on("join-game", (gameId: string) => {
			if (!gameId) {
				socket.emit("error", { message: "gameId is required" });
				return;
			}

			logger.info("Client requesting to join game", { socketId: socket.id, gameId });
			try {
			} catch (err) {
				logger.error("Error joining game", { error: err });
				socket.emit("error", { message: "Failed to join game" });
			}
		});

		// Handle disconnect
		socket.on("disconnect", () => {
			logger.info("Client disconnected", { socketId: socket.id });
			// TODO: Notify orchestrator/game server of disconnect if necessary
		});

		// Error handling
		socket.on("error", (error) => {
			logger.error("Socket error", { socketId: socket.id, error });
		});
	});

	// Middleware for authentication
	io.use((_socket, next) => {
		// Basic auth stub
		// const token = socket.handshake.auth.token;
		// if (!token) return next(new Error('Authentication required'));
		next();
	});
}
