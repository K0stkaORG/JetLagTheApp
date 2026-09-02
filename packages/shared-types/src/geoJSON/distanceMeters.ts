import { Point } from "./types";

import { distance } from "@turf/distance";

/**
 * Calculates the distance between two points in meters.
 *
 * @param pointA - The first point.
 * @param pointB - The second point.
 * @returns The distance between the two points in meters.
 */
export const distanceMeters = (pointA: Point, pointB: Point): number => {
	return distance(pointA, pointB, { units: "meters" });
};
