import { GameIdSchema, GameTypeSchema, TimelinePhaseSchema } from "../models/game";

import z from "zod";
import { Point } from "../geoJSON/types";
import { UserIdSchema } from "../models/user";

export const JoinGameDataPacket = z.object({
	game: z.object({
		id: GameIdSchema,
		type: GameTypeSchema,
		settings: z.record(z.string(), z.any()),
	}),
	timeline: z.object({
		sync: z.date(),
		gameTime: z.int(),
		phase: TimelinePhaseSchema,
	}),
	players: z.array(
		z.object({
			id: UserIdSchema,
			nickname: z.string(),
			colors: z.object({
				light: z.string(),
				dark: z.string(),
			}),
			position: z.object({
				cords: Point,
				gameTime: z.int(),
			}),
			isOnline: z.boolean(),
		}),
	),
	state: z.record(z.string(), z.any()),
});

export type JoinGameDataPacket = z.infer<typeof JoinGameDataPacket>;
