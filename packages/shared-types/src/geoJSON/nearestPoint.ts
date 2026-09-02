import { Point } from "./types";

import { distance } from "@turf/distance";

/**
 * Finds the nearest point in a list of points to a given reference point.
 *
 * @param needle The reference point
 * @param haystack The list of points to search through
 * @returns The nearest point and its distance
 */
export function nearestPoint(needle: Point, haystack: Point[]): { id: number; point: Point; distanceMeters: number } {
	if (haystack.length === 0) throw new Error("Cannot find nearest point: haystack is empty");

	let nearestId = 0;
	let nearest = haystack[0];
	let minDist = distance(needle, nearest, { units: "meters" });

	for (let i = 1; i < haystack.length; i++) {
		const dist = distance(needle, haystack[i], { units: "meters" });

		if (dist < minDist) {
			minDist = dist;
			nearestId = i;
			nearest = haystack[i];
		}
	}

	return { id: nearestId, point: nearest, distanceMeters: minDist };
}
