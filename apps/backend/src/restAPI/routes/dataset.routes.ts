import { GetDatasetRequest, GetDatasetResponse } from "@jetlag/shared-types";
import { Router } from "express";
import { Orchestrator } from "~/lib/game/orchestrator/orchestrator";
import { ProtectedRouteHandler } from "../middleware/auth";
import { UserError } from "../middleware/errorHandler";

const datasetRouter: Router = Router();

datasetRouter.post(
	"/get",
	ProtectedRouteHandler(GetDatasetRequest, (userId, { datasetId }): GetDatasetResponse => {
		const dataset = Orchestrator.instance.getDatasetForUser(userId, datasetId);

		if (!dataset) throw new UserError("Dataset not found");

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
