import z from "zod";
import { Point } from "../../geoJSON/types";

export const RoundaboutDatasetSaveFormat = z.object({
	startingPoint: Point,
	spawns: z.array(Point),
});

export type RoundaboutDatasetSaveFormat = z.infer<typeof RoundaboutDatasetSaveFormat>;
