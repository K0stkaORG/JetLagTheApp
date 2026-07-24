import z from "zod";
import { Point, StrictPolygon } from "../../geoJSON/types";
import { CostCards } from "./questions";

export * from "./cards";
export * from "./questions";

export const HideAndSeekDatasetSaveFormat = z.object({
	gameArea: z.object({
		polygon: StrictPolygon,
		startLocation: Point,
		districts: z.array(
			z.object({
				color: z.string(),
				polygon: StrictPolygon,
			}),
		),
		hidingSpots: z.array(Point),
	}),
	hideTimeSeconds: z.number().positive(),
	handSize: z.number().positive(),
	hidingZoneRadiusMeters: z.number().positive(),
	cards: z.object({
		curses: z.object({}),
		timeBonus: z.array(
			z.object({
				duration: z.number().positive(),
				units: z.enum(["s", "m", "h"]),
				amount: z.number().positive(),
			}),
		),
		rerollCards: z.array(
			z.object({
				discard: z.number().nonnegative(),
				draw: z.number().nonnegative(),
				amount: z.number().positive(),
			}),
		),
		veto: z.number().nonnegative(),
		increaseHandSize: z.number().nonnegative(),
	}),
	questions: z.object({
		radar: z.array(
			z.object({
				radius: z.number().positive(),
				units: z.enum(["m", "km"]),
				costCards: CostCards,
			}),
		),
		thermometer: z.array(
			z.object({
				minDistance: z.number().positive(),
				units: z.enum(["m", "km"]),
				costCards: CostCards,
			}),
		),
		matching: z.object({
			district: z
				.object({
					costCards: CostCards,
				})
				.nullable(),
			districtColor: z
				.object({
					costCards: CostCards,
				})
				.nullable(),
			other: z.array(
				z.object({
					name: z.string(),
					costCards: CostCards,
					points: z.array(Point),
				}),
			),
		}),
		image: z.array(
			z.object({
				name: z.string(),
				description: z.string(),
				costCards: CostCards,
				answerTimeSeconds: z.number().positive(),
			}),
		),
		waitForVetoSeconds: z.number().nonnegative(),
		questionGracePeriodSeconds: z.number().nonnegative(),
	}),
});

export type HideAndSeekDatasetSaveFormat = z.infer<typeof HideAndSeekDatasetSaveFormat>;
