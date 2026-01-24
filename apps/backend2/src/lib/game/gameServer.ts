import { ClientToServerEvents, Game, InterServerEvents, ServerToClientEvents, SocketData } from "@jetlag/shared-types";

import { Server } from "socket.io";
import { logger } from "../logger";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export abstract class GameServer {
	public readonly roomId: string;

	constructor(
		private readonly io: AppServer,
		public readonly game: Game,
	) {
		this.roomId = `game:${game.id}`;
	}

	protected abstract startHook(): Promise<void>;
	public async start() {
		logger.info(`Starting GameServer for game ${this.game.id}`);

		await this.startHook();
	}

	protected abstract shutdownHook(): Promise<void>;
	public async shutdown() {
		logger.info(`Shutting down GameServer for game ${this.game.id}`);

		await this.shutdownHook();

		this.io.socketsLeave(this.roomId);
	}
}
