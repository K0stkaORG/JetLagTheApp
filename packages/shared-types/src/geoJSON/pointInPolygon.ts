import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";

import type { MultiPolygon, Point, Polygon } from "./types";

/**
 * Checks if a point is inside a polygon or multi-polygon.
 *
 * @param point - The point to check.
 * @param polygon - The polygon or multi-polygon to check against.
 * @returns `true` if the point is inside the polygon or multi-polygon, `false` otherwise.
 */
export function pointInPolygon(point: Point, polygon: Polygon | MultiPolygon): boolean {
	return booleanPointInPolygon(point, polygon);
}
