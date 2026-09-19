import z from "zod";

import { MultiPolygon, Point } from "../../geoJSON";
import { GameTime } from "../game";
import { AskedQuestion } from "./questions";

export const HideAndSeekGameStateSaveFormat = z.object({
	gamePhase: z.enum(["hiding", "seeking"]),

	hidingZoneCenterId: z.number().nullable(),
	hidingSpot: Point.nullable(),
	hidingZone: MultiPolygon.nullable(),

	allPossibleHidingSpots: MultiPolygon.nullable(),

	drawDeck: z.array(z.int()),
	offeredCards: z.array(z.int()).nullable(),
	hand: z.array(z.int()),

	questions: z.array(AskedQuestion),
	unansweredQuestionIndex: z.number().nullable(),
	questionGracePeriodUntil: GameTime.or(z.int().nonnegative()),
});

export type HideAndSeekGameStateSaveFormat = z.infer<typeof HideAndSeekGameStateSaveFormat>;

export const HideAndSeekInitialGameState: HideAndSeekGameStateSaveFormat = {
	gamePhase: "hiding",

	hidingZoneCenterId: null,
	hidingSpot: null,
	hidingZone: null,

	allPossibleHidingSpots: null,

	drawDeck: [],
	offeredCards: null,
	hand: [],

	questions: [],
	unansweredQuestionIndex: null,
	questionGracePeriodUntil: 0,
};
