import { IdMap, Polygon } from "~/types";

export const MapById = <T extends { id: number }>(items: T[]): IdMap<T> => {
	const map = new Map<T["id"], T>();

	for (const item of items) map.set(item.id, item);

	return map;
};

export const getBoundingBox = (polygon: Polygon): { n: number; s: number; e: number; w: number } => {
	if (polygon.length === 0) return { n: 0, s: 0, e: 0, w: 0 };

	let n = -Infinity;
	let s = Infinity;
	let e = -Infinity;
	let w = Infinity;

	for (const [lng, lat] of polygon) {
		if (lat > n) n = lat;
		if (lat < s) s = lat;
		if (lng > e) e = lng;
		if (lng < w) w = lng;
	}

	return { n, s, e, w };
};

export const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;
