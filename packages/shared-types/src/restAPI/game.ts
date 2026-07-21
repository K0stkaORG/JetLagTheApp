import { GameTypes, TimelinePhases } from "../models/game";

import z from "zod";
import { Point } from "../models/geometry";

export const JoinGameDataPacket = z.object({
	game: z.object({
		id: z.int(),
		type: z.enum(GameTypes),
		settings: z.record(z.string(), z.any())
	}),
	timeline: z.object({
		sync: z.date(),
		gameTime: z.number(),
		phase: z.enum(TimelinePhases),
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
				cords: Point,
				gameTime: z.number(),
			}),
			isOnline: z.boolean(),
		}),
	),
	state: z.record(z.string(), z.any()),
});

export type JoinGameDataPacket = z.infer<typeof JoinGameDataPacket>;
