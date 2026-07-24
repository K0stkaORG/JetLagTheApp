import z from "zod";
import { NicknameSchema } from "../user";

export const RoundaboutGameSettingsSaveFormat = z.object({
	teams: z
		.array(
			z.object({
				name: z.string(),
				color: z.string(),
				players: z.array(NicknameSchema).min(1, "There must be at least one player in a team"),
			}),
		)
		.min(2, "There must be at least two teams"),
});

export type RoundaboutGameSettingsSaveFormat = z.infer<typeof RoundaboutGameSettingsSaveFormat>;
