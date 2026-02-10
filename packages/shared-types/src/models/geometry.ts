import z from "zod";

export const CoordinatesSchema = z.tuple([z.number(), z.number()]);
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const PolygonSchema = z.array(CoordinatesSchema);
export type Polygon = z.infer<typeof PolygonSchema>;
