import z from "zod";
import { Point } from "../../geoJSON/types";

export const HideAndSeekGameStateSaveFormat = z.object({
	gamePhase: z.enum(["hiding", "seeking"]),
	hidingSpot: Point.nullable(),
});

export type HideAndSeekGameStateSaveFormat = z.infer<typeof HideAndSeekGameStateSaveFormat>;

export const HideAndSeekInitialGameState: HideAndSeekGameStateSaveFormat = {
	gamePhase: "hiding",
	hidingSpot: null,
};
