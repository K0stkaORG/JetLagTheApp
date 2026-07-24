import { bbox } from "@turf/bbox";
import { featureCollection, point, polygon } from "@turf/helpers";
import intersect from "@turf/intersect";
import { voronoi as turfVoronoi } from "@turf/voronoi";
import { MultiPolygon, Point, Polygon, Position } from "./types";

export function vornoi(points: Point[], boundingPolygon: Polygon): MultiPolygon {
	// 1. Guard against empty inputs
	if (points.length === 0 || !boundingPolygon.coordinates.length) return { type: "MultiPolygon", coordinates: [] };

	// 2. Wrap inputs into Turf Features
	const pointsFC = featureCollection(points.map((p) => point(p.coordinates)));
	const boundFeature = polygon(boundingPolygon.coordinates);

	// 3. Compute bounding box directly from the bounding polygon
	const boundsBBox = bbox(boundFeature);

	// 4. Generate the raw Voronoi diagram
	const voronoiDiagram = turfVoronoi(pointsFC, { bbox: boundsBBox });

	if (!voronoiDiagram || !voronoiDiagram.features) return { type: "MultiPolygon", coordinates: [] };

	const clippedCellCoordinates: Position[][][] = [];

	// 5. Clip each Voronoi cell against the single bounding polygon
	for (const cell of voronoiDiagram.features) {
		if (!cell) continue; // Skip null/undefined cells

		// Intersect the cell with the playable area
		const intersection =
			intersect(featureCollection([cell, boundFeature])) ?? (intersect as any)(cell, boundFeature);

		if (!intersection) continue;

		const geom = intersection.geometry;

		if (geom.type === "Polygon") clippedCellCoordinates.push(geom.coordinates as Position[][]);
		else if (geom.type === "MultiPolygon")
			for (const polyCoords of geom.coordinates) clippedCellCoordinates.push(polyCoords as Position[][]);
	}

	return {
		type: "MultiPolygon",
		coordinates: clippedCellCoordinates,
	};
}
