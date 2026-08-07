/* eslint-disable @typescript-eslint/no-explicit-any */
import { AdminGeoResponse, AdminLogsResponse, AdminStateResponse } from "@jetlag/shared-types";
import { Router } from "express";
import { logger } from "~/lib/logger";
import { extractGeoJsonFeatures, serializeValue } from "~/lib/observability";
import { Orchestrator } from "~/lib/orchestrator/orchestrator";
import { AdminRouteHandler } from "../../middleware/admin";

const adminTelemetryRouter: Router = Router();

adminTelemetryRouter.get(
	"/logs",
	AdminRouteHandler(null, (): AdminLogsResponse => ({ logs: logger.logs as string[] })),
);

adminTelemetryRouter.get(
	"/state",
	AdminRouteHandler(null, (): AdminStateResponse => ({
		state: serializeValue(Orchestrator.instance),
	})),
);

adminTelemetryRouter.get(
	"/geo",
	AdminRouteHandler(null, (): AdminGeoResponse => ({
		geoJson: extractGeoJsonFeatures(Orchestrator.instance),
	})),
);

adminTelemetryRouter.post(
	"/restart",
	AdminRouteHandler(null, () => Orchestrator.instance.restart()),
);

export { adminTelemetryRouter };
