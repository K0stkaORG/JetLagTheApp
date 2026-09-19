import { ENV } from "@/env";
import { Dataset, GameType } from "@jetlag/shared-types";
import path from "path";
import { Worker } from "worker_threads";
import { ExtendedError } from "../errors";
import { logger } from "../logger";

export type ParseDatasetWorkerData = {
	datasetId: number;
	metadataId: number;
	version: number;
	gameType: GameType;
	data: Dataset["input"];
};

const workerPath =
	ENV.NODE_ENV === "production"
		? path.resolve(__dirname, "./lib/workers/parseDatasetWorker.js")
		: path.resolve(__dirname, "./parseDatasetWorker.ts");

export const dispatchParseDatasetWorker = (workerData: ParseDatasetWorkerData, apiPath: string): Promise<void> => {
	return new Promise((resolve) => {
		logger.info(
			`Dispatching ParseDatasetWorker (type: ${workerData.gameType}, metadataId: ${workerData.metadataId}, version: ${workerData.version})`,
		);

		const worker = new Worker(workerPath, {
			workerData,
		});

		worker.on("message", (msg: { success: boolean }) => {
			resolve();

			if (msg.success)
				logger.info(
					`ParseDatasetWorker finished (type: ${workerData.gameType}, metadataId: ${workerData.metadataId}, version: ${workerData.version})`,
				);
			else
				logger.error(
					new ExtendedError(
						`ParseDatasetWorker failed (type: ${workerData.gameType}, metadataId: ${workerData.metadataId}, version: ${workerData.version})`,
						{ service: "restAPI", path: apiPath },
					),
				);

			worker.terminate();
		});

		worker.on("error", (error) => {
			logger.error(
				new ExtendedError(
					`ParseDatasetWorker error (type: ${workerData.gameType}, metadataId: ${workerData.metadataId}, version: ${workerData.version})`,
					{
						error,
						service: "restAPI",
						path: apiPath,
					},
				),
			);

			worker.terminate();
		});
	});
};
