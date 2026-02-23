import { GetDatasetRequest, GetDatasetResponse } from "@jetlag/shared-types";
import { Router } from "express";
import { UserRequestError } from "~/lib/errors";
import { Orchestrator } from "~/lib/game/orchestrator/orchestrator";
import { ProtectedRouteHandler } from "../middleware/auth";

const datasetRouter: Router = Router();

datasetRouter.post(
	"/get",
	ProtectedRouteHandler(GetDatasetRequest, (userId, { datasetId }): GetDatasetResponse => {
		const dataset = Orchestrator.instance.getDatasetForUser(userId, datasetId);

		if (!dataset) throw new UserRequestError("Dataset not found");

		return {
			metadata: {
				id: dataset.metadataId,
				name: dataset.name,
			},
			version: dataset.version,
			data: dataset.data,
		};
	}),
);

export { datasetRouter };
