import { GameTime, NULL_POINT, Point, User } from "@jetlag/shared-types";
import { PlayerPositions, db } from "~/db";

import { JoinGameDataPacket } from "@jetlag/shared-types";
import { ENV } from "~/env";
import { ExtendedError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { AppSocket } from "~/lib/types";
import { GameServer } from "./gameServer";
import { registerPlayerSocketEventListeners } from "./playerSocket";

export abstract class Player {
	protected _cords: Point;
	protected _lastCordsUpdate: GameTime;

	protected _socket: AppSocket | null = null;

	constructor(
		protected readonly server: GameServer,
		public readonly user: User,
		initialCords: Point,
		lastCordsUpdate: GameTime,
	) {
		this._cords = initialCords;
		this._lastCordsUpdate = lastCordsUpdate;
	}

	public get cords(): { cords: Point; stale: boolean } {
		return {
			cords: this._cords,
			stale: this.server.timeline.gameTime - this._lastCordsUpdate >= ENV.CORDS_STALE_INTERVAL_S,
		};
	}

	public get socket(): AppSocket | null {
		return this._socket;
	}

	protected abstract registerSocketEventListenersHook(): void;
	private registerSocketEventListeners = registerPlayerSocketEventListeners;

	public bindSocket(socket: AppSocket): void {
		socket.on("disconnect", () => {
			logger.info(
				`Socket (${socket.id}) disconnected, unbinding (user: ${socket.data.userId}, game: ${socket.data.gameId})`,
			);

			this.server.io.in(this.server.roomId).emit("general.player.isOnlineUpdate", {
				userId: this.user.id,
				isOnline: false,
			});

			this._socket = null;
		});

		if (this._socket) {
			logger.info(
				`Player ${this.user.id} (game ${this.server.game.id}) socket re-bind (${this._socket.id} -> ${socket.id})`,
			);

			this._socket.disconnect(true);
		} else logger.info(`Socket (${socket.id}) bound to player ${this.user.id} (game ${this.server.game.id})`);

		socket.data.userId = this.user.id;
		socket.data.gameId = this.server.game.id;

		this.server.io.in(this.server.roomId).emit("general.player.isOnlineUpdate", {
			userId: this.user.id,
			isOnline: true,
		});

		this._socket = socket;

		socket.emit("general.game.joinDataPacket", this.dataJoinPacket);

		socket.join(this.server.roomId);

		this.registerSocketEventListeners.call(this);
		this.registerSocketEventListenersHook();
	}

	protected get dataJoinPacket(): JoinGameDataPacket {
		return {
			game: {
				id: this.server.game.id,
				type: this.server.game.type,
				settings: this.server.gameSettings.serialize(),
			},
			timeline: this.server.timeline.stateSync,
			players: this.server.players.map((player) => {
				const canShowPosition = this.server.getPlayerPositionUpdateRecipients(player).includes(this);

				return {
					...player.user,
					position: canShowPosition
						? {
								cords: player._cords,
								gameTime: player._lastCordsUpdate,
							}
						: {
								cords: NULL_POINT,
								gameTime: 0,
							},
					isOnline: player.isOnline,
				};
			}),
			state: this.server.state.getFilteredStateForPlayer(this),
		};
	}

	public get isOnline(): boolean {
		return this._socket !== null;
	}

	public updatePosition(newCords: Point, gameTime?: GameTime) {
		this.server.scheduleUnattended("PositionUpdate", async () => {
			if (this.server.timeline.phase !== "in-progress")
				return void this._socket?.emit("general.error", {
					message: "Cannot update position when game is not in progress",
				});

			if (gameTime !== undefined && gameTime < this._lastCordsUpdate)
				throw new ExtendedError(
					`Tried to update player position with an older game time. Current: ${this._lastCordsUpdate}, given: ${gameTime}`,
					{
						service: "gameServer",
						gameServer: this.server,
						userId: this.user.id,
					},
				);

			this._cords = newCords;
			this._lastCordsUpdate = gameTime ?? this.server.timeline.gameTime;

			this.server.getPlayerPositionUpdateRecipients(this).forEach((recipient) =>
				recipient._socket?.emit("general.player.positionUpdate", {
					userId: this.user.id,
					cords: newCords,
					gameTime: this._lastCordsUpdate,
				}),
			);

			await db.insert(PlayerPositions).values({
				gameId: this.server.game.id,
				userId: this.user.id,
				cords: newCords.coordinates,
				gameTime: this._lastCordsUpdate,
			});
		});
	}
}
