import { boundedCircle, distanceMeters, MultiPolygon, nearestPoint, Point } from "@jetlag/shared-types";
import { logger } from "~/lib/logger";
import { HideAndSeekServer } from "../hideAndSeekServer";
import { getHiderTeamPosition } from "../utility";

export async function onSeekingPhaseStart(this: HideAndSeekServer) {
	logger.info(`Game ${this.fullName} has entered the seeking phase`);

	// Set the game phase to seeking
	this.state.set((state) => {
		state.gamePhase = "seeking";
	});

	// Get the position of the hider team
	const [hiderTeamPosition, error] = getHiderTeamPosition(this);

	// If the hider team has not picked a hiding zone, pick one for them
	if (this.state.get.hidingZoneCenterId === null) {
		// If we have their position, pick the nearest hiding zone to them
		if (!error) {
			logger.warn(
				`Hider team (Game ${this.fullName}) has not picked a hiding zone, picking the nearest one to their position`,
			);

			const { id: nearestZoneId } = nearestPoint(hiderTeamPosition, this.dataset.gameArea.hidingZoneCenters);

			this.state.set((state) => {
				state.hidingZoneCenterId = nearestZoneId;
			});

			this.players
				.filter((p) => p.team === "hiders")
				.forEach((p) =>
					p.socket?.emit("general.notification", {
						message: `You have not picked a hiding zone, so the nearest one has been automatically selected for you.`,
					}),
				);
		}

		// Otherwise, pick a random hiding zone
		else {
			logger.warn(
				`Hider team (Game ${this.fullName}) has not picked a hiding zone and did not send their position, picking a random zone`,
			);

			const randomZoneId = Math.floor(Math.random() * this.dataset.gameArea.hidingZoneCenters.length);

			this.state.set((state) => {
				state.hidingZoneCenterId = randomZoneId;
			});

			this.players
				.filter((p) => p.team === "hiders")
				.forEach((p) =>
					p.socket?.emit("general.notification", {
						message: `You have not picked a hiding zone and did not send your position, so a random zone has been automatically selected for you.`,
					}),
				);
		}
	}

	// Get the coordinates of the hiding zone center
	const hidingSpot = this.dataset.gameArea.hidingZoneCenters[this.state.get.hidingZoneCenterId!] as Point;

	// Check how far the hiders are from their hiding zone
	if (!error) {
		const distanceFromHidingZone =
			distanceMeters(hidingSpot, hiderTeamPosition) - this.dataset.hidingZoneRadiusMeters;

		// If the hiders are outside their hiding zone, notify the players
		if (distanceFromHidingZone > 0)
			this.io.emit("general.notification", {
				message: `Hiders are ${distanceFromHidingZone} meters away from their hiding zone`,
			});
	} else
		this.io.emit("general.notification", {
			message: `Cannot determine, whether the hiders are inside their hiding zone or not`,
		});

	// Get hiding zone polygon
	const hidingZone = boundedCircle(hidingSpot, this.dataset.hidingZoneRadiusMeters, this.dataset.gameArea.polygon);

	this.state.set((state) => {
		// What the seekers see as the remaining possible hiding spots
		state.allPossibleHidingSpots = this.dataset.gameArea.allPossibleHidingSpots as MultiPolygon;

		// What the hiders see as their hiding zone
		state.hidingZone = hidingZone;

		// Hider team configurable exact hiding spot (center of the hiding zone by default)
		state.hidingSpot = hidingSpot;
	});

	// Commit the state changes
	await this.state.commit();
}
