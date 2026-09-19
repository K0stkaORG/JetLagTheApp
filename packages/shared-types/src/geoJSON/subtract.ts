import { MultiPolygon, Polygon } from "./types";

import difference from "@turf/difference";
import { feature, featureCollection } from "@turf/helpers";
import { MultiPolygon as MultiPolygonGeoJSON, Polygon as PolygonGeoJSON } from "geojson";

/**
 * Subtracts a Polygon or MultiPolygon from another Polygon or MultiPolygon
 * and returns the resulting MultiPolygon.
 *
 * @param source The Polygon/MultiPolygon to subtract from
 * @param target The Polygon/MultiPolygon to subtract
 * @returns A MultiPolygon representing the remaining area
 */
export function subtract(source: Polygon | MultiPolygon, target: Polygon | MultiPolygon): MultiPolygon {
	const diff = difference(
		featureCollection<PolygonGeoJSON | MultiPolygonGeoJSON>([feature(source), feature(target)]),
	);

	if (!diff) return { type: "MultiPolygon", coordinates: [] };

	const { geometry } = diff;

	if (geometry.type === "Polygon")
		return {
			type: "MultiPolygon",
			coordinates: [geometry.coordinates as Polygon["coordinates"]],
		};

	return {
		type: "MultiPolygon",
		coordinates: geometry.coordinates as MultiPolygon["coordinates"],
	};
}
