import { circle } from "@turf/turf";
import { Position } from "geojson";
import { MultiPolygon, Point } from "./types";

/**
 * Creates individual circular buffer polygons around each input point and
 * returns them combined into a GeoJSON MultiPolygon.
 *
 * @param points Array of Point objects
 * @param radiusMeters Circle radius in meters
 * @param steps Optional number of polygon steps/vertices (default: 64 for smooth circles)
 */
export function circlesAroundPoints(points: Point[], radiusMeters: number, steps: number = 64): MultiPolygon {
	if (points.length === 0 || radiusMeters <= 0) return { type: "MultiPolygon", coordinates: [] };

	const polygonCoordinates: Position[][][] = points.map((pt) => {
		// Generate a GeoJSON Polygon feature for the circle
		const circleFeature = circle(pt.coordinates, radiusMeters, {
			units: "meters",
			steps,
		});

		// circleFeature.geometry.coordinates has type Position[][] (Exterior ring)
		return circleFeature.geometry.coordinates as Position[][];
	});

	return {
		type: "MultiPolygon",
		coordinates: polygonCoordinates as MultiPolygon["coordinates"],
	};
}
