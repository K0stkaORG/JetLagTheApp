import z from "zod";
import { UserIdSchema } from "../user";

export const HideAndSeekGameSettingsSaveFormat = z.object({
    hiderIds: z.array(UserIdSchema),
});

export type HideAndSeekGameSettingsSaveFormat = z.infer<typeof HideAndSeekGameSettingsSaveFormat>;
