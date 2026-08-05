import { feature, featureCollection } from "@turf/helpers";
import intersect from "@turf/intersect";
import { MultiPolygon as MultiPolygonGeoJSON, Polygon as PolygonGeoJSON } from "geojson";
import { DeepReadonly } from "../utility/types";
import { MultiPolygon, Polygon } from "./types";

/**
 * Clips a Polygon or MultiPolygon against a bounding Polygon and returns the resulting MultiPolygon.
 *
 * @param source The Polygon/MultiPolygon to be clipped
 * @param target The Polygon to clip against
 * @returns A MultiPolygon representing the clipped area
 */
export function clipToPolygon(
	source: DeepReadonly<Polygon> | DeepReadonly<MultiPolygon>,
	target: DeepReadonly<Polygon>,
): MultiPolygon {
	const intersection = intersect(
		featureCollection<PolygonGeoJSON | MultiPolygonGeoJSON>([
			feature(source as Polygon | MultiPolygon),
			feature(target as Polygon),
		]),
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
