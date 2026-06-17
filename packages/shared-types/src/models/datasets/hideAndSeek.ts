import z from "zod";
import { Coords, Polygon } from "../geometry";

export const HideAndSeekDatasetSaveFormat = z.object({
	gameArea: z.object({
		polygon: Polygon,
		startLocation: Coords,
		districts: z.array(
			z.object({
				color: z.string(),
				polygon: Polygon,
			}),
		),
		hidingSpots: z.array(Coords),
	}),
	hideTimeSeconds: z.number().positive(),
	handSize: z.number().positive(),
	hidingZoneRadiusMeters: z.number().positive(),
	cards: z.object({
		timeBonus: z.array(
			z.object({
				seconds: z.number().positive(),
				amount: z.number().nonnegative(),
			}),
		),
		veto: z.number().nonnegative(),
	}),
	questions: z.object({
		radar: z.array(
			z.object({
				name: z.string(),
				radiusMeters: z.number().positive(),
				costCards: z.number().positive(),
			}),
		),
		thermometer: z.array(
			z.object({
				name: z.string(),
				distanceMeters: z.number().positive(),
				costCards: z.number().positive(),
			}),
		),
	}),
});

export type HideAndSeekDatasetSaveFormat = z.infer<typeof HideAndSeekDatasetSaveFormat>;
