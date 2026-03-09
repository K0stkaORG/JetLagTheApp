import z from "zod";
import { NicknameSchema } from "../user";

export const RoundaboutGameSettingsSaveFormat = z.object({
	teams: z.array(
		z.object({
			name: z.string(),
			color: z.string(),
			players: z.array(NicknameSchema),
		}),
	),
});

export type RoundaboutGameSettingsSaveFormat = z.infer<typeof RoundaboutGameSettingsSaveFormat>;
