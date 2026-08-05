import z from "zod";
import { MultiPolygon, Point } from "../../geoJSON/types";

export const HideAndSeekGameStateSaveFormat = z.object({
	gamePhase: z.enum(["hiding", "seeking"]),

	hidingZoneCenterId: z.number().nullable(),
	hidingSpot: Point.nullable(),
	hidingZone: MultiPolygon.nullable(),

	allPossibleHidingSpots: MultiPolygon.nullable(),

	drawDeck: z.array(z.int()),
	offeredCards: z.array(z.int()).nullable(),
	hand: z.array(z.int()),
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
};
