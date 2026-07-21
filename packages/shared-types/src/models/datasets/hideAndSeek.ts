import z from "zod";
import { checkPolygonValidity, Point, Polygon } from "../../geoJSON/types";

export const HideAndSeekDatasetSaveFormat = z.object({
	gameArea: z.object({
		polygon: Polygon.refine(checkPolygonValidity, "First and last point in polygon are not equal"),
		startLocation: Point,
		districts: z.array(
			z.object({
				color: z.string(),
				polygon: Polygon.refine(checkPolygonValidity, "First and last point in polygon are not equal"),
			}),
		),
		hidingSpots: z.array(Point),
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
