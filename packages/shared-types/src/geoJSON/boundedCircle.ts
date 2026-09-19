import { MultiPolygon, Point, Polygon } from "./types";
import { union } from "./union";

import { circle } from "@turf/circle";

/**
 * Creates a circle around a point, bounded by a given polygon
 *
 * @param point Center point of the circle
 * @param radiusMeters Circle radius in meters
 * @param boundingPolygon Bounding Polygon to clip the circle to
 * @returns A MultiPolygon representing the circle bounded by the bounding polygon
 */
export function boundedCircle(point: Point, radiusMeters: number, boundingPolygon: Polygon): MultiPolygon {
	if (radiusMeters <= 0) return { type: "MultiPolygon", coordinates: [] };

	// Generate a GeoJSON Polygon for the circle
	const circlePolygon = circle(point, radiusMeters, {
		units: "meters",
	}).geometry as Polygon;

	// Clip the circle polygon to the bounding polygon and return the result
	return union(circlePolygon, boundingPolygon);
}
