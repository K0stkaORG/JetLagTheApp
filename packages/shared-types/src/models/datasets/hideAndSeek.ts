import { CoordinatesSchema, PolygonSchema } from "../geometry";

import z from "zod";

export const HideAndSeekDatasetSaveFormat = z.object({
	description: z.string().default(""),
	gameAreaPolygon: PolygonSchema.default([]),
	startingPosition: CoordinatesSchema.default([0, 0]),
	centreBoundingBoxNE: CoordinatesSchema.default([0, 0]),
	centreBoundingBoxSW: CoordinatesSchema.default([0, 0]),
	minZoom: z.number().default(10),
	maxZoom: z.number().default(18),
	startingZoom: z.number().default(15),
	hidingTime: z.number().default(60),
	timeBonusMultiplier: z.number().default(1),
	questions: z.array(z.number()).default([]),
	cards: z
		.array(
			z.object({
				cardId: z.number(),
				amount: z.number(),
			}),
		)
		.default([]),
});

export type HideAndSeekDatasetSaveFormat = z.infer<typeof HideAndSeekDatasetSaveFormat>;
