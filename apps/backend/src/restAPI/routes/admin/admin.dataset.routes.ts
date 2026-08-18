import {
	AdminCreateDatasetRequest,
	AdminDatasetInfoResponse,
	AdminDatasetsListResponse,
	AdminNewDatasetVersionRequest,
	AdminRequestWithDatasetMetadataId,
	getDatasetInputSchema,
} from "@jetlag/shared-types";
import { DatasetMetadata, Datasets, db, eq, inArray } from "~/db";

import { Router } from "express";
import { UserRequestError } from "~/lib/errors";
import { dispatchParseDatasetWorker } from "~/lib/workers/dispatchParseDatasetWorker";
import { AdminRouteHandler } from "../../middleware/admin";

const adminDatasetsRouter: Router = Router();

adminDatasetsRouter.get(
	"/list",
	AdminRouteHandler(null, async (): Promise<AdminDatasetsListResponse> => {
		const datasetsMetadata = await db.query.DatasetMetadata.findMany({
			with: {
				datasets: {
					where: inArray(Datasets.state, ["parsing", "latest", "errored"]),
					columns: {
						version: true,
						state: true,
					},
					limit: 1,
					orderBy: (datasets, { desc }) => [desc(datasets.version)],
				},
			},
		});

		return datasetsMetadata.map((metadata) => ({
			metadataId: metadata.id,
			name: metadata.name,
			gameType: metadata.gameType,
			lastVersion: metadata.datasets[0]?.version ?? null,
			state: metadata.datasets[0]?.state ?? "parsing",
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
						state: true,
					},
					orderBy: (datasets, { desc }) => [desc(datasets.version)],
				},
			},
		});

		if (!metadata) throw new UserRequestError("Dataset not found");

		const latestVersion = metadata.datasets[0];

		return {
			metadataId: metadata.id,
			name: metadata.name,
			gameType: metadata.gameType,
			lastVersion: latestVersion?.version ?? null,
			state: latestVersion?.state ?? "parsing",
			data: latestVersion?.input ?? {},
			versions: metadata.datasets.map((d) => ({
				version: d.version,
				state: d.state,
				data: d.input,
			})),
		};
	}),
);

adminDatasetsRouter.post(
	"/create",
	AdminRouteHandler(
		AdminCreateDatasetRequest,
		async ({ name, gameType, data }): Promise<AdminRequestWithDatasetMetadataId> => {
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

			const datasetId = await db
				.insert(Datasets)
				.values({
					metadataId,
					version: 1,
					state: "parsing",
					input: validation.data,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					parsed: {} as any,
				})
				.returning({ id: Datasets.id })
				.then((r) => r[0].id);

			dispatchParseDatasetWorker(
				{
					datasetId,
					metadataId,
					version: 1,
					gameType,
					data: validation.data,
				},
				"/admin/datasets/create",
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
					columns: {
						version: true,
					},
					orderBy: (datasets, { desc }) => [desc(datasets.version)],
				},
			},
			where: eq(DatasetMetadata.id, metadataId),
		});

		if (!metadata) throw new UserRequestError("Dataset not found");

		const validation = getDatasetInputSchema(metadata.gameType).safeParse(data);
		if (!validation.success) throw new UserRequestError(`Invalid dataset format: ${validation.error.message}`);

		const newVersion = (metadata.datasets[0]?.version ?? 0) + 1;

		const datasetId = await db
			.insert(Datasets)
			.values({
				metadataId,
				version: newVersion,
				state: "parsing",
				input: validation.data,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				parsed: {} as any,
			})
			.returning({ id: Datasets.id })
			.then((r) => r[0].id);

		dispatchParseDatasetWorker(
			{
				datasetId,
				metadataId,
				version: newVersion,
				gameType: metadata.gameType,
				data: validation.data,
			},
			req.path,
		);
	}),
);

export { adminDatasetsRouter };
