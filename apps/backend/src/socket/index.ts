import { AppServer, AppSocket } from "~/lib/types";

import { SocketAuthToken } from "@jetlag/shared-types";
import { Auth } from "~/lib/auth";
import { ExtendedError } from "~/lib/errors";
import { Player } from "~/lib/game/gameServer/player";
import { Orchestrator } from "~/lib/game/orchestrator/orchestrator";
import { logger } from "~/lib/logger";

export function setupSocketHandlers(io: AppServer): void {
	io.on("connection", (socket: AppSocket) => {
		// Error handling
		socket.on("error", (error) =>
			logger.error(
				new ExtendedError(error.message ?? "Unknown socket error", {
					error,
					service: "socket",
					socketId: socket.id,
					gameServer: Orchestrator.instance.getServer(socket.data.gameId),
					userId: socket.data.userId,
				}),
			),
		);
	});

	// Middleware for authentication
	io.use(async (socket, next) => {
		const throwError = (message: string) => {
			const error = new ExtendedError(message, {
				service: "socket",
				socketId: socket.id,
				event: "handshake",
			});

			logger.warn(error);

			next(error);
		};

		const socketTokenValidation = SocketAuthToken.safeParse(socket.handshake.auth.token);

		if (!socketTokenValidation.success)
			return throwError(`Authentication failed: ` + socketTokenValidation.error.issues[0].message);

		const userId = await Auth.jwt.verify(socketTokenValidation.data.jwt);

		if (userId == null) return throwError(`Authentication failed: Invalid token`);
		const server = Orchestrator.instance.getServer(socketTokenValidation.data.gameId);
		let player: Player | undefined;

		if (!server || !(player = server.players.get(userId)))
			return throwError(
				`Authentication failed: User ${userId} does not have access to game ${socketTokenValidation.data.gameId}`,
			);

		logger.info(
			`Socket (${socket.id}) authenticated (user: ${userId}, game: ${socketTokenValidation.data.gameId})`,
		);

		player.bindSocket(socket);

		next();
	});
}
