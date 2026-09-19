import { Point, Polygon } from "./types";

import { circle as turfCircle } from "@turf/circle";

/**
 * Creates a circle around a point
 *
 * @param point Center point of the circle
 * @param radiusMeters Circle radius in meters
 * @returns A Polygon representing the circle
 */
export function circle(point: Point, radiusMeters: number): Polygon {
	if (radiusMeters <= 0) return { type: "Polygon", coordinates: [] };

	// Generate a GeoJSON Polygon for the circle
	return turfCircle(point, radiusMeters, {
		units: "meters",
	}).geometry as Polygon;
}
