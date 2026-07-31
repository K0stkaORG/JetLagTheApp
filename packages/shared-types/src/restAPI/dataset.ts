import z from "zod";
import { Dataset, DatasetMetadata } from "../models/game";
import { DatasetParsedFormat } from "../models/shared/dataset";

export const GetDatasetRequest = z.object({
	datasetId: z.number(),
});
export type GetDatasetRequest = z.infer<typeof GetDatasetRequest>;

export type GetDatasetResponse = Pick<Dataset, "version"> & {
	metadata: Pick<DatasetMetadata, "id" | "name">;
	data: DatasetParsedFormat;
};
