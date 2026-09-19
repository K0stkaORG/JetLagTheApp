import { BisectorSplit, MultiPolygon, Point, Polygon } from "./types";

import { bbox as getBbox } from "@turf/bbox";
import { feature, featureCollection, multiPolygon, point, polygon } from "@turf/helpers";
import { intersect } from "@turf/intersect";
import { toMercator, toWgs84 } from "@turf/projection";
import { voronoi as turfVoronoi } from "@turf/voronoi";
import { MultiPolygon as MultiPolygonGeoJSON, Point as PointGeoJSON, Polygon as PolygonGeoJSON } from "geojson";

/**
 * Splits the world along the perpendicular bisector between two points.
 *
 * @param boundingPolygon The polygon used to generate the bounding box for the split
 * @param first The first point defining the bisector line
 * @param second The opposing point defining the bisector line
 * @returns The two Voronoi cells split by the bisector line
 */
export function splitOnBisector(boundingPolygon: Polygon | MultiPolygon, first: Point, second: Point): BisectorSplit {
	const boundFeature = feature(boundingPolygon);

	// 1. Convert input geometries into Web Mercator (meter space) for distortion-free calculation
	const boundMercator = toMercator(boundFeature);
	const pointsMercator = featureCollection([
		toMercator(point(first.coordinates)),
		toMercator(point(second.coordinates)),
	]);

	// 2. Generate the two raw Voronoi cells over the bounding area (expanded to include both points,
	// so the sites always lie inside the extent and both cells exist)
	const bbox = getBbox(
		featureCollection<PointGeoJSON | PolygonGeoJSON | MultiPolygonGeoJSON>([
			boundMercator,
			...pointsMercator.features,
		]),
	);
	const voronoiDiagram = turfVoronoi(pointsMercator, { bbox });

	// Cell order matches the input point order (cellA contains pointA, cellB contains pointB)
	const [firstCell, secondCell] = toWgs84(voronoiDiagram).features;

	return [firstCell.geometry, secondCell.geometry] as BisectorSplit;
}

/**
 * Clips a MultiPolygon to a single half-plane containing the target point.
 *
 * @param targetPolygon The MultiPolygon geometry to clip
 * @param split The point split created by splitOnBisector
 * @param keep Which half of the split to keep ("first" or "second")
 * @returns A MultiPolygon representing the clipped area
 */
export function keepHalfPlaneWithPoint(
	targetPolygon: MultiPolygon,
	split: BisectorSplit,
	keep: "first" | "second",
): MultiPolygon {
	if (!targetPolygon.coordinates.length)
		return {
			type: "MultiPolygon",
			coordinates: [],
		};

	const cell = keep === "first" ? split[0] : split[1];

	const intersection = intersect(
		featureCollection<PolygonGeoJSON | MultiPolygonGeoJSON>([
			polygon(cell.coordinates),
			multiPolygon(targetPolygon.coordinates),
		]),
	);

	if (!intersection)
		return {
			type: "MultiPolygon",
			coordinates: [],
		};

	if (intersection.geometry.type === "Polygon")
		return {
			type: "MultiPolygon",
			coordinates: [intersection.geometry.coordinates as Polygon["coordinates"]],
		};

	return intersection.geometry as MultiPolygon;
}
