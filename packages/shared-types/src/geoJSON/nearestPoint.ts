import { distance } from "@turf/distance";
import { Point } from "./types";

export function nearestPoint(needle: Point, haystack: Point[]): { point: Point; distanceMeters: number } {
	if (haystack.length === 0) throw new Error("Cannot find nearest point: haystack is empty");

	let nearest = haystack[0];
	let minDist = distance(needle, nearest, { units: "meters" });

	for (let i = 1; i < haystack.length; i++) {
		const dist = distance(needle, haystack[i], { units: "meters" });

		if (dist < minDist) {
			minDist = dist;
			nearest = haystack[i];
		}
	}

	return { point: nearest, distanceMeters: minDist };
}
