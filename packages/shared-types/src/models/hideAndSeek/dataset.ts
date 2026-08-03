import z from "zod";
import { circlesAroundPoints, clipMultiPolygon } from "../../geoJSON";
import { MultiPolygon, Point, StrictPolygon } from "../../geoJSON/types";
import { IdMap } from "../../utility/idMap";
import { Card, getCardsMap } from "./cards";
import { CostCards, getQuestionsMap, Question } from "./questions";

export * from "./cards";
export * from "./questions";

export const HideAndSeekDatasetInputFormat = z.object({
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
	hideTimeSeconds: z.int().positive(),
	handSize: z.int().positive(),
	hidingZoneRadiusMeters: z.int().positive(),
	cards: z.object({
		curses: z.object({}),
		timeBonus: z.array(
			z.object({
				duration: z.int().positive(),
				units: z.enum(["s", "m", "h"]),
				amount: z.int().positive(),
			}),
		),
		rerollCards: z.array(
			z.object({
				discard: z.int().nonnegative(),
				draw: z.int().nonnegative(),
				amount: z.int().positive(),
			}),
		),
		veto: z.int().nonnegative(),
		increaseHandSize: z.int().nonnegative(),
	}),
	questions: z.object({
		radar: z.array(
			z.object({
				radius: z.int().positive(),
				units: z.enum(["m", "km"]),
				costCards: CostCards,
			}),
		),
		thermometer: z.array(
			z.object({
				minDistance: z.int().positive(),
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
				answerTimeSeconds: z.int().positive(),
			}),
		),
		waitForVetoSeconds: z.int().nonnegative(),
		questionGracePeriodSeconds: z.int().nonnegative(),
	}),
});

export type HideAndSeekDatasetInputFormat = z.infer<typeof HideAndSeekDatasetInputFormat>;

export type HideandSeekDatasetParsedFormat = Omit<HideAndSeekDatasetInputFormat, "gameArea" | "questions" | "cards"> & {
	gameArea: HideAndSeekDatasetInputFormat["gameArea"] & {
		allPossibleHidingPlaces: MultiPolygon;
	};
	questions: IdMap<number, Question>;
	cards: IdMap<number, Card>;
};

export const parseHideAndSeekDataset = (data: HideAndSeekDatasetInputFormat): HideandSeekDatasetParsedFormat => {
	return {
		...data,
		gameArea: {
			...data.gameArea,
			allPossibleHidingPlaces: clipMultiPolygon(
				circlesAroundPoints(data.gameArea.hidingSpots, data.hidingZoneRadiusMeters),
				data.gameArea.polygon,
			),
		},
		questions: getQuestionsMap(data),
		cards: getCardsMap(data),
	};
};
