import {
	AdminCreateDatasetRequest,
	AdminDatasetInfoResponse,
	AdminDatasetsListResponse,
	AdminNewDatasetVersionRequest,
	AdminRequestWithDatasetMetadataId,
	getDatasetInputSchema,
} from "@jetlag/shared-types";
import { DatasetMetadata, Datasets, and, db, eq } from "~/db";

import { Router } from "express";
import { UserRequestError } from "~/lib/errors";
import { dispatchParseDatasetWorker } from "~/lib/game/workers/dispatchParseDatasetWorker";
import { AdminRouteHandler } from "../../middleware/admin";

const adminDatasetsRouter: Router = Router();

adminDatasetsRouter.get(
	"/list",
	AdminRouteHandler(null, async (): Promise<AdminDatasetsListResponse> => {
		const datasetsMetadata = await db.query.DatasetMetadata.findMany({
			with: {
				datasets: {
					where: eq(Datasets.latest, true),
					columns: {
						version: true,
					},
				},
			},
		});

		return datasetsMetadata.map((metadata) => ({
			metadataId: metadata.id,
			name: metadata.name,
			gameType: metadata.gameType,
			lastVersion: metadata.datasets[0]?.version ?? 0,
		}));
	}),
);

adminDatasetsRouter.post(
	"/info",
	AdminRouteHandler(AdminRequestWithDatasetMetadataId, async ({ metadataId }): Promise<AdminDatasetInfoResponse> => {
		const metadata = await db.query.DatasetMetadata.findFirst({
			where: eq(DatasetMetadata.id, metadataId),
			with: {
				datasets: {
					columns: {
						version: true,
						input: true,
					},
					where: eq(Datasets.latest, true),
					limit: 1,
				},
			},
		});

		if (!metadata) throw new UserRequestError("Dataset not found");

		const latestVersion = metadata.datasets[0];

		return {
			metadataId: metadata.id,
			name: metadata.name,
			gameType: metadata.gameType,
			lastVersion: latestVersion?.version ?? 0,
			data: latestVersion?.input ?? {},
		};
	}),
);

adminDatasetsRouter.post(
	"/create",
	AdminRouteHandler(
		AdminCreateDatasetRequest,
		async ({ name, gameType, data }, req): Promise<AdminRequestWithDatasetMetadataId> => {
			const validation = getDatasetInputSchema(gameType).safeParse(data);

			if (!validation.success) throw new UserRequestError(`Invalid dataset format: ${validation.error.message}`);

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

			dispatchParseDatasetWorker(
				{
					metadataId,
					version: 1,
					gameType,
					data: validation.data,
				},
				req.path,
			);

			return {
				metadataId,
			};
		},
	),
);

adminDatasetsRouter.post(
	"/version/add",
	AdminRouteHandler(AdminNewDatasetVersionRequest, async ({ metadataId, data }, req) => {
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
			where: eq(DatasetMetadata.id, metadataId),
		});

		if (!metadata) throw new UserRequestError("Dataset not found");

		const validation = getDatasetInputSchema(metadata.gameType).safeParse(data);
		if (!validation.success) throw new UserRequestError(`Invalid dataset format: ${validation.error.message}`);

		await db
			.update(Datasets)
			.set({ latest: false })
			.where(and(eq(Datasets.metadataId, metadataId), eq(Datasets.latest, true)));

		dispatchParseDatasetWorker(
			{
				metadataId,
				version: metadata.datasets[0].version !== undefined ? metadata.datasets[0].version + 1 : 1,
				gameType: metadata.gameType,
				data: validation.data,
			},
			req.path,
		);
	}),
);

export { adminDatasetsRouter };
