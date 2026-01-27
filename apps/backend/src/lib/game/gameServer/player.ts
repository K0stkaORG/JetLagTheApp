import { Cords, GameTime, User } from "@jetlag/shared-types";
import { PlayerPositions, db } from "~/db";

import { AppSocket } from "~/lib/types";
import { ENV } from "~/env";
import { GameServer } from "./gameServer";
import { logger } from "~/lib/logger";
import { registerPlayerSocketEventListeners } from "./playerSocket";

export abstract class Player {
	protected _cords: Cords;
	protected _lastCordsUpdate: GameTime;

	protected socket: AppSocket | null = null;

	constructor(
		protected readonly server: GameServer,
		public readonly user: User,
		initialCords: Cords,
		lastCordsUpdate: GameTime,
	) {
		this._cords = initialCords;
		this._lastCordsUpdate = lastCordsUpdate;
	}

	public get cords(): { cords: Cords; stale: boolean } {
		return {
			cords: this._cords,
			stale: this.server.timeline.gameTime - this._lastCordsUpdate >= ENV.CORDS_STALE_INTERVAL_S,
		};
	}

	protected abstract registerSocketEventListenersHook(): void;
	private registerSocketEventListeners = registerPlayerSocketEventListeners;

	public bindSocket(socket: AppSocket): void {
		socket.on("disconnect", () => {
			logger.info(
				`Socket (${socket.id}) disconnected, unbinding (user: ${socket.data.userId}, game: ${socket.data.gameId})`,
			);

			this.socket = null;
		});

		if (this.socket) {
			logger.info(
				`Player ${this.user.id} (game ${this.server.game.id}) socket re-bind (${this.socket.id} -> ${socket.id})`,
			);

			this.socket.disconnect(true);
		} else logger.info(`Socket (${socket.id}) bound to player ${this.user.id} (game ${this.server.game.id})`);

		socket.data.userId = this.user.id;
		socket.data.gameId = this.server.game.id;

		socket.join(this.server.roomId);

		this.socket = socket;

		this.registerSocketEventListeners.call(this);
		this.registerSocketEventListenersHook();
	}

	public get isOnline(): boolean {
		return this.socket !== null;
	}

	public async updatePosition(newCords: Cords, gameTime?: GameTime): Promise<void> {
		if (gameTime !== undefined && gameTime < this._lastCordsUpdate)
			throw new Error(
				`Tried to update player (${this.user.id}) position with an older game time in game ${this.server.game.id} (${this.server.game.type}). Current: ${this._lastCordsUpdate}, given: ${gameTime}`,
			);

		this._cords = newCords;
		this._lastCordsUpdate = gameTime ?? this.server.timeline.gameTime;

		this.server.getPlayerPositionUpdateRecipients(this).forEach((recipient) =>
			recipient.socket?.emit("general:playerPositionUpdate", {
				userId: this.user.id,
				cords: newCords,
				gameTime: this._lastCordsUpdate,
			}),
		);

		await db.insert(PlayerPositions).values({
			gameId: this.server.game.id,
			userId: this.user.id,
			cords: newCords,
			gameTime: this._lastCordsUpdate,
		});
	}
}
