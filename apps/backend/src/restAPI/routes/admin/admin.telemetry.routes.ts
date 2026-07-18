import { AdminTelemetryResponse } from "@jetlag/shared-types";

import { Router } from "express";
import { logger } from "~/lib/logger";
import { AdminRouteHandler } from "../../middleware/admin";

const adminTelemetryRouter: Router = Router();

adminTelemetryRouter.get(
	"/",
	AdminRouteHandler(null, async (): Promise<AdminTelemetryResponse> => ({ logs: logger.logs as string[] })),
);

export { adminTelemetryRouter };
