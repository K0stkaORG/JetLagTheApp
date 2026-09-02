import { Router } from "express";
import { adminAuthRouter } from "./admin.auth.routes";
import { adminDatasetsRouter } from "./admin.dataset.routes";
import { adminGamesRouter } from "./admin.game.routes";
import { adminTelemetryRouter } from "./admin.telemetry.routes";
import { adminUsersRouter } from "./admin.users.routes";

const adminRouter: Router = Router();

adminRouter.use("/", adminAuthRouter);
adminRouter.use("/games", adminGamesRouter);
adminRouter.use("/datasets", adminDatasetsRouter);
adminRouter.use("/users", adminUsersRouter);
adminRouter.use("/telemetry", adminTelemetryRouter);

export { adminRouter };
