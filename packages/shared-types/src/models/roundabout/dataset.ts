import z from "zod";
import { Point } from "../../geoJSON/types";

export const RoundaboutDatasetInputFormat = z.object({
	startingPoint: Point,
	spawns: z.array(Point),
});

export type RoundaboutDatasetInputFormat = z.infer<typeof RoundaboutDatasetInputFormat>;

export type RoundaboutDatasetParsedFormat = RoundaboutDatasetInputFormat;

export const parseRoundaboutDataset = (data: RoundaboutDatasetInputFormat): RoundaboutDatasetParsedFormat => {
	return data;
};
