import { circle } from "@turf/turf";
import { MultiPolygon, Point, Polygon } from "./types";

/**
 * Creates individual circular buffer polygons around each input point and
 * returns them combined into a GeoJSON MultiPolygon.
 *
 * @param points Array of Point objects
 * @param radiusMeters Circle radius in meters
 */
export function circlesAroundPoints(points: Point[], radiusMeters: number): MultiPolygon {
	if (points.length === 0 || radiusMeters <= 0) return { type: "MultiPolygon", coordinates: [] };

	const coordinates: MultiPolygon["coordinates"] = points.map((pt) => {
		// Generate a GeoJSON Polygon feature for the circle
		const circleFeature = circle(pt.coordinates, radiusMeters, {
			units: "meters",
		});

		// circleFeature.geometry.coordinates has type Position[][] (Exterior ring)
		return circleFeature.geometry.coordinates as Polygon["coordinates"];
	});

	return {
		type: "MultiPolygon",
		coordinates,
	};
}
