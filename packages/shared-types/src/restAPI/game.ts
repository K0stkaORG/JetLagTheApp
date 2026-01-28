import z from "zod";

export const JoinGameDataPacket = z.object({
	game: z.object({
		id: z.int(),
		type: z.enum(["hideAndSeek", "roundabout"]),
	}),
	timeline: z.object({
		sync: z.date(),
		gameTime: z.number(),
		phase: z.enum(["not-started", "in-progress", "paused", "ended"]),
	}),
	players: z.array(
		z.object({
			id: z.int(),
			nickname: z.string(),
			colors: z.object({
				light: z.string(),
				dark: z.string(),
			}),
			position: z.object({
				cords: z.tuple([z.number(), z.number()]),
				gameTime: z.number(),
			}),
			isOnline: z.boolean(),
		}),
	),
});

export type JoinGameDataPacket = z.infer<typeof JoinGameDataPacket>;
