import { distance } from "@turf/distance";
import { DeepReadonly } from "../utility/types";
import { Point } from "./types";

/**
 * Finds the nearest point in a list of points to a given reference point.
 *
 * @param needle The reference point
 * @param haystack The list of points to search through
 * @returns The nearest point and its distance
 */
export function nearestPoint(
	needle: DeepReadonly<Point>,
	haystack: DeepReadonly<Point[]>,
): { id: number; point: Point; distanceMeters: number } {
	if (haystack.length === 0) throw new Error("Cannot find nearest point: haystack is empty");

	let nearestId = 0;
	let nearest = haystack[0];
	let minDist = distance(needle as Point, nearest as Point, { units: "meters" });

	for (let i = 1; i < haystack.length; i++) {
		const dist = distance(needle as Point, haystack[i] as Point, { units: "meters" });

		if (dist < minDist) {
			minDist = dist;
			nearestId = i;
			nearest = haystack[i];
		}
	}

	return { id: nearestId, point: nearest as Point, distanceMeters: minDist };
}
