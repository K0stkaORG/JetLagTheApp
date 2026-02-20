import z from "zod";

export const RoundaboutGameSettingsSaveFormat = z.object({});

export type RoundaboutGameSettingsSaveFormat = z.infer<typeof RoundaboutGameSettingsSaveFormat>;
