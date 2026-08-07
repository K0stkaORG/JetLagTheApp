import { DatasetParsedFormat, GetDatasetRequest, GetDatasetResponse } from "@jetlag/shared-types";
import { Router } from "express";
import { UserRequestError } from "~/lib/errors";
import { Orchestrator } from "~/lib/orchestrator/orchestrator";
import { ProtectedRouteHandler } from "../middleware/auth";

const datasetRouter: Router = Router();

datasetRouter.post(
	"/",
	ProtectedRouteHandler(GetDatasetRequest, (userId, { datasetId }): GetDatasetResponse => {
		const gameServer = Orchestrator.instance.getGameServerWithDataset(userId, datasetId);

		if (!gameServer) throw new UserRequestError("Dataset not found");

		return {
			metadata: {
				metadataId: gameServer.datasetMetadata.metadataId,
				datasetId: gameServer.datasetMetadata.datasetId,
				name: gameServer.datasetMetadata.name,
			},
			version: gameServer.datasetMetadata.version,
			data: gameServer.dataset as DatasetParsedFormat,
		};
	}),
);

export { datasetRouter };
