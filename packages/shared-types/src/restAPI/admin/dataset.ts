import z from "zod";
import { DatasetMetadataIdSchema, DatasetNameSchema } from "../../models/dataset";
import { Dataset, DatasetMetadata, DatasetState, GameTypeSchema } from "../../models/game";

export { DatasetState };

export const AdminRequestWithDatasetMetadataId = z.object({
	metadataId: DatasetMetadataIdSchema,
});
export type AdminRequestWithDatasetMetadataId = z.infer<typeof AdminRequestWithDatasetMetadataId>;

export type AdminDatasetsListResponse = {
	metadataId: DatasetMetadata["id"];
	name: DatasetMetadata["name"];
	gameType: DatasetMetadata["gameType"];
	lastVersion: Dataset["version"] | null;
	state: DatasetState;
}[];

export type AdminDatasetVersionInfo = {
	version: Dataset["version"];
	state: DatasetState;
	data: Dataset["input"];
};

export type AdminDatasetInfoResponse = AdminDatasetsListResponse[number] & {
	data: Dataset["input"];
	versions: AdminDatasetVersionInfo[];
};

export const AdminCreateDatasetRequest = z.object({
	name: DatasetNameSchema,
	gameType: GameTypeSchema,
	data: z.record(z.string(), z.any()),
});
export type AdminCreateDatasetRequest = z.infer<typeof AdminCreateDatasetRequest>;

export type AdminCreateDatasetResponse = {
	metadataId: DatasetMetadata["id"];
};

export const AdminNewDatasetVersionRequest = z.object({
	metadataId: DatasetMetadataIdSchema,
	data: z.record(z.string(), z.any()),
});
export type AdminNewDatasetVersionRequest = z.infer<typeof AdminNewDatasetVersionRequest>;
