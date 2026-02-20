import z from "zod";

export const HideAndSeekGameSettingsSaveFormat = z.object({});

export type HideAndSeekGameSettingsSaveFormat = z.infer<typeof HideAndSeekGameSettingsSaveFormat>;
