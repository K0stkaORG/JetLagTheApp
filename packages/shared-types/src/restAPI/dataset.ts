import z from "zod";
import { DatasetIdSchema } from "../models/dataset";
import { Dataset, DatasetMetadata } from "../models/game";
import { DatasetParsedFormat } from "../models/shared/dataset";

export const GetDatasetRequest = z.object({
	datasetId: DatasetIdSchema,
});
export type GetDatasetRequest = z.infer<typeof GetDatasetRequest>;

export type GetDatasetResponse = Pick<Dataset, "version"> & {
	metadata: Pick<DatasetMetadata, "name"> & {
		datasetId: Dataset["id"];
		metadataId: DatasetMetadata["id"];
	};
	data: DatasetParsedFormat;
};
