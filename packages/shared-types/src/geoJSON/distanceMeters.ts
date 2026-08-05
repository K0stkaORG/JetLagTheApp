import { distance } from "@turf/distance";
import { DeepReadonly } from "../utility/types";
import { Point } from "./types";

/**
 * Calculates the distance between two points in meters.
 *
 * @param pointA - The first point.
 * @param pointB - The second point.
 * @returns The distance between the two points in meters.
 */
export const distanceMeters = (pointA: DeepReadonly<Point>, pointB: DeepReadonly<Point>): number => {
	return distance(pointA as Point, pointB as Point, { units: "meters" });
};
