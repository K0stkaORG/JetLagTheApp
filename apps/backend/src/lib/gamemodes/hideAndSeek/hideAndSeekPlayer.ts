import { distanceMeters, GameTime, Point, User } from "@jetlag/shared-types";
import { Player } from "~/lib/gameServer/player";
import { HideAndSeekServer } from "./hideAndSeekServer";
import { getHiderTeamPosition } from "./utility";

export class HideAndSeekPlayer extends Player {
	declare protected readonly server: HideAndSeekServer;

	public constructor(
		server: HideAndSeekServer,
		user: User,
		initialCords: Point,
		lastCordsUpdate: GameTime,
		public readonly team: "hiders" | "seekers",
	) {
		super(server, user, initialCords, lastCordsUpdate);
	}

	protected pickHidingZoneCenter(centerId: number, overrideGPS?: boolean) {
		this.server.scheduleUnattended("PickHidingZoneCenter", async () => {
			if (!this.server.timeline.running)
				return this.throwError("Cannot pick hiding zone center because the game is not running.");

			if (this.server.state.get.gamePhase !== "hiding")
				return this.throwError("Cannot pick hiding zone center because the game is not in the hiding phase.");

			const hidingZoneCenter = this.server.dataset.gameArea.hidingZoneCenters[centerId] as Point | undefined;

			if (!hidingZoneCenter) return this.throwError(`Selected hiding zone center does not exist.`);

			if (!overrideGPS) {
				const [hiderTeamPosition, error] = getHiderTeamPosition(this.server);

				if (error)
					return void this._socket?.emit("hideAndSeek.hiders.pickHidingZoneCenter.GPSCheckFailed", {
						type: "failedToGetHiderTeamPosition",
					});

				const distanceFromHidingZone =
					distanceMeters(hidingZoneCenter, hiderTeamPosition) - this.server.dataset.hidingZoneRadiusMeters;

				if (distanceFromHidingZone > 0)
					return void this._socket?.emit("hideAndSeek.hiders.pickHidingZoneCenter.GPSCheckFailed", {
						type: "outsideOfHidingZone",
					});
			}

			await this.server.state
				.set((state) => {
					state.hidingZoneCenterId = centerId;
				})
				.commit();
		});
	}

	protected registerSocketEventListenersHook(): void {
		switch (this.team) {
			case "hiders":
				this._socket?.on("hideAndSeek.hiders.pickHidingZoneCenter", ({ centerId }) => {
					this.pickHidingZoneCenter(centerId);
				});

				this._socket?.on("hideAndSeek.hiders.pickHidingZoneCenter.overrideGPS", ({ centerId }) => {
					this.pickHidingZoneCenter(centerId, true);
				});

				this._socket?.on("hideAndSeek.hiders.pickHidingSpot", (_data) => {});

				break;

			case "seekers":
				break;
		}
	}
}
