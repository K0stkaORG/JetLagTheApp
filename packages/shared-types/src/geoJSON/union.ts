import { MultiPolygon, Polygon } from "./types";

import { feature, featureCollection } from "@turf/helpers";
import intersect from "@turf/intersect";
import { MultiPolygon as MultiPolygonGeoJSON, Polygon as PolygonGeoJSON } from "geojson";

/**
 * Unions two Polygon or MultiPolygon geometries and returns the resulting MultiPolygon.
 *
 * @param a One of the Polygon/MultiPolygon geometries to be joined
 * @param b Another Polygon/MultiPolygon geometry to join against
 * @returns A MultiPolygon representing the joined area
 */
export function union(a: Polygon | MultiPolygon, b: Polygon | MultiPolygon): MultiPolygon {
	const union = intersect(featureCollection<PolygonGeoJSON | MultiPolygonGeoJSON>([feature(a), feature(b)]));

	if (!union) return { type: "MultiPolygon", coordinates: [] };

	const { geometry } = union;

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
