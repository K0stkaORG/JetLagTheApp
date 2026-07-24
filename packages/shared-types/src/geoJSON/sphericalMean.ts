import { NULL_POINT, Point } from "./types";

export function sphericalMean(points: Point[]): Point {
	if (points.length === 0) return NULL_POINT;

	let xSum = 0;
	let ySum = 0;
	let zSum = 0;

	for (const pt of points) {
		const [lon, lat] = pt.coordinates;

		// Convert degrees to radians
		const lonRad = (lon * Math.PI) / 180;
		const latRad = (lat * Math.PI) / 180;

		// Convert spherical coordinates to 3D Cartesian (unit sphere)
		xSum += Math.cos(latRad) * Math.cos(lonRad);
		ySum += Math.cos(latRad) * Math.sin(lonRad);
		zSum += Math.sin(latRad);
	}

	const total = points.length;
	const xAvg = xSum / total;
	const yAvg = ySum / total;
	const zAvg = zSum / total;

	// Handle edge case where vectors completely cancel out
	if (xAvg === 0 && yAvg === 0 && zAvg === 0) return NULL_POINT;

	// Convert back to latitude and longitude
	const hyp = Math.sqrt(xAvg * xAvg + yAvg * yAvg);
	const latAvg = Math.atan2(zAvg, hyp) * (180 / Math.PI);
	const lonAvg = Math.atan2(yAvg, xAvg) * (180 / Math.PI);

	return {
		type: "Point",
		coordinates: [lonAvg, latAvg],
	};
}
