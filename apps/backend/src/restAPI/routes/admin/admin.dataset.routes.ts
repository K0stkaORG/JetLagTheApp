import {
	AdminAddDatasetVersionRequest,
	AdminCreateDatasetRequest,
	AdminCreateDatasetResponse,
	AdminDatasetInfoResponse,
	AdminDatasetsListResponse,
	AdminRequestWithDatasetId,
	DatasetSaveFormat,
	getDatasetSchema,
} from "@jetlag/shared-types";
import { DatasetMetadata, Datasets, and, db, eq } from "~/db";

import { AdminRouteHandler } from "../../middleware/admin";
import { Router } from "express";
import { UserError } from "~/restAPI/middleware/errorHandler";

const adminDatasetsRouter: Router = Router();

adminDatasetsRouter.get(
	"/list",
	AdminRouteHandler(null, async (): Promise<AdminDatasetsListResponse> => {
		const datasets = await db.query.DatasetMetadata.findMany({
			with: {
				datasets: {
					where: eq(Datasets.latest, true),
					columns: {
						version: true,
					},
				},
			},
		});

		return datasets.map((dataset) => ({
			id: dataset.id,
			name: dataset.name,
			gameType: dataset.gameType,
			lastVersion: dataset.datasets[0]?.version ?? 0,
		}));
	}),
);

adminDatasetsRouter.post(
	"/info",
	AdminRouteHandler(AdminRequestWithDatasetId, async ({ datasetId }): Promise<AdminDatasetInfoResponse> => {
		const dataset = await db.query.DatasetMetadata.findFirst({
			where: eq(DatasetMetadata.id, datasetId),
			with: {
				datasets: {
					columns: {
						version: true,
						data: true,
					},
					where: eq(Datasets.latest, true),
					limit: 1,
				},
			},
		});

		if (!dataset) throw new UserError("Dataset not found");

		const latestVersion = dataset.datasets[0];

		return {
			id: dataset.id,
			name: dataset.name,
			gameType: dataset.gameType,
			lastVersion: latestVersion?.version ?? 0,
			data: latestVersion?.data ?? {},
		};
	}),
);

adminDatasetsRouter.post(
	"/create",
	AdminRouteHandler(
		AdminCreateDatasetRequest,
		async ({ name, gameType, data }): Promise<AdminCreateDatasetResponse> => {
			const validation = getDatasetSchema(gameType).safeParse(data);

			if (!validation.success) throw new UserError(`Invalid dataset format: ${validation.error.message}`);

			const metadataId = await db
				.insert(DatasetMetadata)
				.values({
					name,
					gameType,
				})
				.returning({
					id: DatasetMetadata.id,
				})
				.then((r) => r[0].id);

			await db.insert(Datasets).values({
				metadataId: metadataId,
				version: 1,
				latest: true,
				data: validation.data as DatasetSaveFormat,
			});

			return { id: metadataId };
		},
	),
);

adminDatasetsRouter.post(
	"/version/add",
	AdminRouteHandler(AdminAddDatasetVersionRequest, async ({ datasetId, data }): Promise<void> => {
		const metadata = await db.query.DatasetMetadata.findFirst({
			columns: {
				gameType: true,
			},
			with: {
				datasets: {
					limit: 1,
					where: eq(Datasets.latest, true),
					columns: {
						version: true,
					},
				},
			},
			where: eq(DatasetMetadata.id, datasetId),
		});

		if (!metadata) throw new UserError("Dataset not found");

		const validation = getDatasetSchema(metadata.gameType).safeParse(data);
		if (!validation.success) throw new UserError(`Invalid dataset format: ${validation.error.message}`);

		await db
			.update(Datasets)
			.set({ latest: false })
			.where(and(eq(Datasets.metadataId, datasetId), eq(Datasets.latest, true)));

		await db.insert(Datasets).values({
			metadataId: datasetId,
			version: metadata.datasets[0].version ?? 1,
			latest: true,
			data: validation.data as DatasetSaveFormat,
		});
	}),
);

export { adminDatasetsRouter };
