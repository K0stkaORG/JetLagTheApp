import { z } from "zod/v4";

export const JOIN_GAME_SERVER_PACKET = z.object({
	gameId: z.number(),
	token: z.string(),
});

export type JOIN_GAME_SERVER_PACKET = z.infer<typeof JOIN_GAME_SERVER_PACKET>;
