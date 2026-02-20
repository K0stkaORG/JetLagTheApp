import z from "zod";
import { Coords } from "../geometry";

export const RoundaboutDatasetSaveFormat = z.object({
	startingPoint: Coords,
	spawns: z.array(Coords),
});

export type RoundaboutDatasetSaveFormat = z.infer<typeof RoundaboutDatasetSaveFormat>;
