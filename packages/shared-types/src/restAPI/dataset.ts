import z from "zod";
import { Dataset, DatasetMetadata } from "../models/game";

export const GetDatasetRequest = z.object({
	datasetId: z.number(),
});
export type GetDatasetRequest = z.infer<typeof GetDatasetRequest>;

export type GetDatasetResponse = Pick<Dataset, "version" | "data"> & {
	metadata: Pick<DatasetMetadata, "id" | "name">;
};
