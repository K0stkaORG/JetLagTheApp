import { boundedCircle, distanceMeters, MultiPolygon, nearestPoint, Point, Polygon } from "@jetlag/shared-types";

export async function getHidingZone({
	hiderTeamPosition,
	hidingZoneCenters,
	hidingZoneRadiusMeters,
	gameAreaPolygon,
	currentHidingZoneCenterId,
}: {
	hiderTeamPosition: Point | null;
	hidingZoneCenters: Point[];
	hidingZoneRadiusMeters: number;
	gameAreaPolygon: Polygon;
	currentHidingZoneCenterId: number | null;
}): Promise<{
	/**
	 * The resolved hiding zone center ID:
	 * - The existing one if the hiders already picked
	 * - The nearest one if hider position was available
	 * - A random one if no position was available
	 */
	hidingZoneCenterId: number;
	/** How the zone ID was determined — lets the handler decide what to log/notify */
	resolution: "existing" | "nearest" | "random";
	/** The hiding zone polygon clipped to the game area (for state.hidingZone) */
	hidingZone: MultiPolygon;
	/** Center point of the chosen hiding zone (for state.hidingSpot) */
	hidingSpot: Point;
	/**
	 * Distance in meters the hiders are outside their hiding zone.
	 * Null if hider position was unavailable; 0 or negative means they are inside.
	 */
	distanceFromHidingZoneMeters: number | null;
}> {
	let hidingZoneCenterId: number;
	let resolution: "existing" | "nearest" | "random";

	if (currentHidingZoneCenterId !== null) {
		hidingZoneCenterId = currentHidingZoneCenterId;
		resolution = "existing";
	} else if (hiderTeamPosition !== null) {
		const { id } = nearestPoint(hiderTeamPosition, hidingZoneCenters);
		hidingZoneCenterId = id;
		resolution = "nearest";
	} else {
		hidingZoneCenterId = Math.floor(Math.random() * hidingZoneCenters.length);
		resolution = "random";
	}

	const hidingSpot = hidingZoneCenters[hidingZoneCenterId] as Point;
	const hidingZone = boundedCircle(hidingSpot, hidingZoneRadiusMeters, gameAreaPolygon);
	const distanceFromHidingZoneMeters =
		hiderTeamPosition !== null ? distanceMeters(hidingSpot, hiderTeamPosition) - hidingZoneRadiusMeters : null;

	return {
		hidingZoneCenterId,
		resolution,
		hidingZone,
		hidingSpot,
		distanceFromHidingZoneMeters,
	};
}
