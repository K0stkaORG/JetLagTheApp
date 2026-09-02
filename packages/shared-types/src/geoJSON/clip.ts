import { MultiPolygon, Polygon } from "./types";

import { feature, featureCollection } from "@turf/helpers";
import intersect from "@turf/intersect";
import { MultiPolygon as MultiPolygonGeoJSON, Polygon as PolygonGeoJSON } from "geojson";

/**
 * Clips a Polygon or MultiPolygon against a bounding Polygon and returns the resulting MultiPolygon.
 *
 * @param source The Polygon/MultiPolygon to be clipped
 * @param target The Polygon to clip against
 * @returns A MultiPolygon representing the clipped area
 */
export function clipToPolygon(source: Polygon | MultiPolygon, target: Polygon): MultiPolygon {
	const intersection = intersect(
		featureCollection<PolygonGeoJSON | MultiPolygonGeoJSON>([feature(source), feature(target)]),
	);

	if (!intersection) return { type: "MultiPolygon", coordinates: [] };

	const { geometry } = intersection;

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
