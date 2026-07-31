import {
	AdminAddDatasetVersionRequest,
	AdminCreateDatasetRequest,
	AdminDatasetInfoResponse,
	AdminDatasetsListResponse,
	AdminRequestWithDatasetId,
	DatasetInputFormat,
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
						input: true,
					},
					where: eq(Datasets.latest, true),
					limit: 1,
				},
			},
		});

		if (!dataset) throw new UserRequestError("Dataset not found");

		const latestVersion = dataset.datasets[0];

		return {
			id: dataset.id,
			name: dataset.name,
			gameType: dataset.gameType,
			lastVersion: latestVersion?.version ?? 0,
			data: latestVersion?.input ?? {},
		};
	}),
);

adminDatasetsRouter.post(
	"/create",
	AdminRouteHandler(AdminCreateDatasetRequest, async ({ name, gameType, data }, req, res) => {
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

		res.json({ id: metadataId }).send();

		dispatchParseDatasetWorker(
			{
				metadataId,
				version: 1,
				gameType,
				data: validation.data as DatasetInputFormat,
			},
			req.path,
		);
	}),
);

adminDatasetsRouter.post(
	"/version/add",
	AdminRouteHandler(AdminAddDatasetVersionRequest, async ({ datasetId, data }, req, res) => {
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

		if (!metadata) throw new UserRequestError("Dataset not found");

		const validation = getDatasetInputSchema(metadata.gameType).safeParse(data);
		if (!validation.success) throw new UserRequestError(`Invalid dataset format: ${validation.error.message}`);

		await db
			.update(Datasets)
			.set({ latest: false })
			.where(and(eq(Datasets.metadataId, datasetId), eq(Datasets.latest, true)));

		res.sendStatus(200).send();

		dispatchParseDatasetWorker(
			{
				metadataId: datasetId,
				version: metadata.datasets[0].version !== undefined ? metadata.datasets[0].version + 1 : 1,
				gameType: metadata.gameType,
				data: validation.data as DatasetInputFormat,
			},
			req.path,
		);
	}),
);

export { adminDatasetsRouter };
