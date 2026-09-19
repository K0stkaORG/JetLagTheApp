import { logger } from "@/lib/logger";
import { HideAndSeekServer } from "../hideAndSeekServer";
import { getHiderTeamPosition } from "../utility";

export async function onSeekingPhaseStart(this: HideAndSeekServer) {
	logger.info(`Game ${this.fullName} has entered the seeking phase`);

	// Set the game phase to seeking
	this.state.set((state) => {
		state.gamePhase = "seeking";
	});

	// Get the position of the hider team (null if unavailable)
	const [hiderTeamPosition] = getHiderTeamPosition(this);

	// Get the hiding zone for the hider team
	const { resolution, hidingZoneCenterId, hidingZone, hidingSpot, distanceFromHidingZoneMeters } =
		await this.worker.run("getHidingZone", {
			hiderTeamPosition,
			hidingZoneCenters: this.dataset.gameArea.hidingZoneCenters,
			hidingZoneRadiusMeters: this.dataset.hidingZoneRadiusMeters,
			gameAreaPolygon: this.dataset.gameArea.polygon,
			currentHidingZoneCenterId: this.state.current.hidingZoneCenterId,
		});

	// Notify players if the hiding zone was auto-assigned
	if (resolution === "nearest") {
		logger.warn(
			`Hider team (Game ${this.fullName}) has not picked a hiding zone, picking the nearest one to their position`,
		);

		this.players
			.filter((p) => p.team === "hiders")
			.forEach((p) =>
				p.socket?.emit("general.notification", {
					message: `You have not picked a hiding zone, so the nearest one has been automatically selected for you.`,
				}),
			);
	} else if (resolution === "random") {
		logger.warn(
			`Hider team (Game ${this.fullName}) has not picked a hiding zone and did not send their position, picking a random zone`,
		);

		this.players
			.filter((p) => p.team === "hiders")
			.forEach((p) =>
				p.socket?.emit("general.notification", {
					message: `You have not picked a hiding zone and did not send your position, so a random zone has been automatically selected for you.`,
				}),
			);
	}

	// Notify all players about the hiders' distance from their hiding zone
	if (distanceFromHidingZoneMeters === null)
		this.io.in(this.roomId).emit("general.notification", {
			message: `Cannot determine, whether the hiders are inside their hiding zone or not`,
		});
	else if (distanceFromHidingZoneMeters > 0)
		this.io.in(this.roomId).emit("general.notification", {
			message: `Hiders are ${distanceFromHidingZoneMeters} meters away from their hiding zone`,
		});

	await this.state
		.set((state) => {
			state.hidingZoneCenterId = hidingZoneCenterId;
			state.allPossibleHidingSpots = this.dataset.gameArea.allPossibleHidingSpots;
			state.hidingZone = hidingZone;
			state.hidingSpot = hidingSpot;
		})
		.commit();
}
