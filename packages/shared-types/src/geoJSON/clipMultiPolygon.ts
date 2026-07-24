import { featureCollection, polygon } from "@turf/helpers";
import intersect from "@turf/intersect";
import { MultiPolygon, Polygon, Position } from "./types"; // Path to your types

/**
 * Clips a MultiPolygon (such as a set of circles) so that all shapes
 * stay strictly within the boundaries of a game area Polygon.
 */
export function clipMultiPolygon(multiPoly: MultiPolygon, boundingPolygon: Polygon): MultiPolygon {
	if (!multiPoly.coordinates.length || !boundingPolygon.coordinates.length) {
		return { type: "MultiPolygon", coordinates: [] };
	}

	const boundFeature = polygon(boundingPolygon.coordinates);
	const clippedCoordinates: Position[][][] = [];

	// Iterate over each polygon in the MultiPolygon
	for (const polyCoords of multiPoly.coordinates) {
		const polyFeature = polygon(polyCoords);

		// Intersect the individual shape with the game area
		const intersection =
			intersect(featureCollection([polyFeature, boundFeature])) ?? (intersect as any)(polyFeature, boundFeature);

		if (!intersection) continue; // Shape fell completely outside the game area

		const geom = intersection.geometry;

		// Add valid clipped coordinates to our output list
		if (geom.type === "Polygon") {
			clippedCoordinates.push(geom.coordinates as Position[][]);
		} else if (geom.type === "MultiPolygon") {
			for (const coords of geom.coordinates) {
				clippedCoordinates.push(coords as Position[][]);
			}
		}
	}

	return {
		type: "MultiPolygon",
		coordinates: clippedCoordinates,
	};
}
