import z from "zod";

export const HideAndSeekDatasetSaveFormat = z.object({});

export type HideAndSeekDatasetSaveFormat = z.infer<typeof HideAndSeekDatasetSaveFormat>;
