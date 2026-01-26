import { AppServer, AppSocket } from "~/lib/types";

import { logger } from "~/lib/logger";
import { Auth } from "~/lib/auth";
import { Orchestrator } from "~/lib/game/orchestrator/orchestrator";
import { SocketAuthToken } from "@jetlag/shared-types";
import { Player } from "~/lib/game/gameServer/player";

export function setupSocketHandlers(io: AppServer): void {
	io.on("connection", (socket: AppSocket) => {
		// Handle disconnect
		socket.on("disconnect", () => {
			logger.info(
				`Socket (${socket.id}) disconnected (user: ${socket.data.userId}, game: ${socket.data.gameId})`,
			);

			const player = Orchestrator.instance.getServer(socket.data.gameId)?.players.get(socket.data.userId);

			if (player) player.unbindSocket(socket.id);
		});

		// Error handling
		socket.on("error", (error) => {
			logger.error(`Socket (${socket.id}) error`, { service: "socket", error });
		});
	});

	// Middleware for authentication
	io.use(async (socket, next) => {
		const throwError = (message: string) => {
			logger.warn(message);

			next(new Error(message));
		};

		if (!socket.handshake.auth.token)
			return throwError(`Socket (${socket.id}) authentication failed: Token is required`);

		const socketTokenValidation = SocketAuthToken.safeParse(socket.handshake.auth.token);

		if (!socketTokenValidation.success)
			return throwError(
				`Socket (${socket.id}) authentication failed: ` + socketTokenValidation.error.issues[0].message,
			);

		const userId = await Auth.jwt.verify(socketTokenValidation.data.jwt);

		if (userId == null) return throwError(`Socket (${socket.id}) authentication failed: Invalid token`);
		const server = Orchestrator.instance.getServer(socketTokenValidation.data.gameId);
		let player: Player | undefined;

		if (!server || !(player = server.players.get(userId)))
			return throwError(
				`Socket (${socket.id}) authentication failed: User ${userId} does not have access to game ${socketTokenValidation.data.gameId}`,
			);

		logger.info(
			`Socket (${socket.id}) authenticated (user: ${userId}, game: ${socketTokenValidation.data.gameId})`,
		);

		socket.data.userId = userId;
		socket.data.gameId = socketTokenValidation.data.gameId;

		socket.join(server.roomId);

		player.bindSocket(socket);

		next();
	});
}
