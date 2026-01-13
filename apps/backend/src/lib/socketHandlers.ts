import z, { ZodError } from "zod/v4";

import { JOIN_GAME_SERVER_PACKET } from "./validation";
import { Orchestrator } from "./orchestrator";
import { Socket } from "socket.io";
import { io } from "./io";
import { verifyJWT } from "./auth";

export const joinPacketHandler =
	(orchestrator: Orchestrator, socket: Socket, timeout: NodeJS.Timeout) => async (data: any) => {
		clearTimeout(timeout);

		let parsed: JOIN_GAME_SERVER_PACKET;

		try {
			parsed = JOIN_GAME_SERVER_PACKET.parse(data);
		} catch (error) {
			io.orchestrator.warnWithSocket(
				socket.id,
				`Sent malformed join packet`,
				"",
				z.prettifyError(error as ZodError),
				"",
				data
			);
			socket.disconnect(true);
			return;
		}

		const userId = await verifyJWT(parsed.token);

		if (userId === null) {
			io.orchestrator.warnWithSocket(socket.id, `Sent an invalid auth token in a join packet`, "", data);
			socket.disconnect(true);
			return;
		}

		const gameServer = orchestrator.getServerById(parsed.gameId);

		if (!gameServer) {
			io.orchestrator.warnWithSocket(socket.id, `Tried to join a non-existent game server, kicking...`, "", data);

			socket.emit("kick");

			socket.disconnect(true);
			return;
		}

		if (!gameServer.isJoinableByUser(userId)) {
			io.orchestrator.warnWithSocket(
				socket.id,
				`Tried to join a game server they are not allowed to join, kicking...`,
				"",
				data
			);

			socket.emit("kick");

			socket.disconnect(true);
			return;
		}

		gameServer.join(socket, userId);
	};
