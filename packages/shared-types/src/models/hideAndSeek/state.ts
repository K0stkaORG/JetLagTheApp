import z from "zod";
import { Point } from "../../geoJSON/types";

export const HideAndSeekGameStateSaveFormat = z.object({
	gamePhase: z.enum(["hiding", "seeking"]),
	hidingSpot: Point.nullable(),
	drawDeck: z.array(z.int()),
	offeredCards: z.array(z.int()).nullable(),
	hand: z.array(z.int()),
});

export type HideAndSeekGameStateSaveFormat = z.infer<typeof HideAndSeekGameStateSaveFormat>;

export const HideAndSeekInitialGameState: HideAndSeekGameStateSaveFormat = {
	gamePhase: "hiding",
	hidingSpot: null,
	drawDeck: [],
	offeredCards: null,
	hand: [],
};
