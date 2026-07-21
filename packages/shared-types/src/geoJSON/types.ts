import z from "zod";

const Position = z.tuple([z.number(), z.number()]);
export type Position = [Longitude: number, Latitude: number];

export const Point = z.object({
	type: z.literal("Point"),
	coordinates: Position,
});

export const Line = z.object({
	type: z.literal("LineString"),
	coordinates: z.array(Position).min(2),
});

export const Polygon = z.object({
	type: z.literal("Polygon"),
	coordinates: z.array(z.array(Position).min(4)),
});

export const MultiPolygon = z.object({
	type: z.literal("MultiPolygon"),
	coordinates: z.array(z.array(z.array(Position).min(4))),
});

export type Point = { type: "Point"; coordinates: [Longitude: number, Latitude: number] };
export type Line = { type: "LineString"; coordinates: [Longitude: number, Latitude: number][] };
export type Polygon = { type: "Polygon"; coordinates: [Longitude: number, Latitude: number][][] };
export type MultiPolygon = { type: "MultiPolygon"; coordinates: [Longitude: number, Latitude: number][][][] };

export const NULL_POINT: Point = { type: "Point", coordinates: [0, 0] } as const;
export const isPointValid = (point: Point): boolean => point.coordinates[0] !== 0 || point.coordinates[1] !== 0;
export const toPoint = (coordinates: [Longitude: number, Latitude: number]): Point => ({ type: "Point", coordinates });

export const checkPolygonValidity = (polygon: Pick<Polygon, "coordinates">): boolean =>
    polygon.coordinates.every((ring) => ring[0]?.[0] === ring[ring.length - 1]?.[0] && ring[0]?.[1] === ring[ring.length - 1]?.[1]);


export const checkMultiPolygonValidity = (multiPolygon: MultiPolygon): boolean =>
	multiPolygon.coordinates.every((polygon) => checkPolygonValidity({ coordinates: polygon }));

// @ts-ignore
const _check: {
	point: z.infer<typeof Point>;
	line: z.infer<typeof Line>;
	polygon: z.infer<typeof Polygon>;
	multiPolygon: z.infer<typeof MultiPolygon>;
} = {
	point: {} as Point,
	line: {} as Line,
	polygon: {} as Polygon,
	multiPolygon: {} as MultiPolygon,
};
