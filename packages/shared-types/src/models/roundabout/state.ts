import z from "zod";

export const RoundaboutGameStateSaveFormat = z.object({});

export type RoundaboutGameStateSaveFormat = z.infer<typeof RoundaboutGameStateSaveFormat>;

export const RoundaboutInitialGameState: RoundaboutGameStateSaveFormat = {};
