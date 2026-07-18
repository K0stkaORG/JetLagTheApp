import z from "zod";
import { NicknameSchema } from "../user";

export const HideAndSeekGameSettingsSaveFormat = z.object({
	hiders: z.array(NicknameSchema).min(1, "There must be at least one hider"),
});

export type HideAndSeekGameSettingsSaveFormat = z.infer<typeof HideAndSeekGameSettingsSaveFormat>;
