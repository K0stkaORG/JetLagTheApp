import { buffer } from "@turf/buffer";
import { feature, featureCollection } from "@turf/helpers";
import { union } from "@turf/union";
import { MultiPolygon, Point } from "./types";

/**
 * Creates circles around each input point and joins them into a single MultiPolygon
 *
 * @param points Array of Point objects
 * @param radiusMeters Circle radius in meters
 * @returns A MultiPolygon with the joined circles
 */
export function joinedCirclesAroundPoints(points: Point[], radiusMeters: number): MultiPolygon {
	const emptyMultiPolygon: MultiPolygon = { type: "MultiPolygon", coordinates: [] };

	if (points.length === 0 || radiusMeters <= 0) return emptyMultiPolygon;

	const collection = featureCollection(points.map((p) => feature(p)));

	const buffered = buffer(collection, radiusMeters, { units: "meters" });

	if (!buffered) return emptyMultiPolygon;

	const geometry = union(buffered)?.geometry;

	if (!geometry) return emptyMultiPolygon;

	if (geometry.type === "Polygon")
		return {
			type: "MultiPolygon",
			coordinates: [geometry.coordinates] as MultiPolygon["coordinates"],
		};

	return geometry as MultiPolygon;
}
