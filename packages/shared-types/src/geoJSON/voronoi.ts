import { bbox as getBbox } from "@turf/bbox";
import { featureCollection, point, polygon } from "@turf/helpers";
import { intersect } from "@turf/intersect";
import { toMercator, toWgs84 } from "@turf/projection";
import { voronoi as turfVoronoi } from "@turf/voronoi";
import { MultiPolygon, Point, Polygon, Voronoi } from "./types";

/**
 * Computes an accurate metric Voronoi diagram for a set of points clipped to a bounding polygon,
 * pairing each original input point with its corresponding spatial region.
 *
 * @param points - The input points around which to generate Voronoi cells.
 * @param boundingPolygon - The boundary polygon used to clip the Voronoi cells.
 * @returns An array of objects containing the original input `Point` and its clipped `MultiPolygon` zone (`Voronoi`).
 */
export function voronoi(points: Point[], boundingPolygon: Polygon): Voronoi {
	if (points.length === 0 || !boundingPolygon.coordinates.length) return [];

	// Edge case: single point owns the entire game area
	if (points.length === 1)
		return [
			{
				point: points[0],
				zone: {
					type: "MultiPolygon",
					coordinates: [boundingPolygon.coordinates as Polygon["coordinates"]],
				},
			},
		];

	const boundFeature = polygon(boundingPolygon.coordinates);

	// 1. Convert input geometries into Web Mercator (meter space) for distortion-free calculation
	const boundMercator = toMercator(boundFeature);
	const pointsMercatorFC = featureCollection(points.map((p) => toMercator(point(p.coordinates))));

	// 2. Generate raw Voronoi cells in projected metric space
	const bbox = getBbox(boundMercator);
	const voronoiDiagram = turfVoronoi(pointsMercatorFC, { bbox });

	if (!voronoiDiagram || !voronoiDiagram.features) return [];

	const results: Voronoi = [];

	// 3. Clip cells against the metric bounding polygon and unproject back to WGS84 [lon, lat]
	for (let i = 0; i < points.length; i++) {
		const cell = voronoiDiagram.features[i];
		if (!cell) continue;

		const intersectionMercator = intersect(featureCollection([cell, boundMercator]));
		if (!intersectionMercator) continue;

		// Unproject clipped cell back to standard latitude/longitude
		const intersection = toWgs84(intersectionMercator);
		const geometry = intersection.geometry;

		if (geometry.type === "Polygon")
			results.push({
				point: points[i],
				zone: {
					type: "MultiPolygon",
					coordinates: [geometry.coordinates as Polygon["coordinates"]],
				},
			});
		else if (geometry.type === "MultiPolygon")
			results.push({
				point: points[i],
				zone: {
					type: "MultiPolygon",
					coordinates: geometry.coordinates as MultiPolygon["coordinates"],
				},
			});
	}

	return results;
}
