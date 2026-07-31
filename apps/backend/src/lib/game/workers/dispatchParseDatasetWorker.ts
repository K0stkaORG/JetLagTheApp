import { DatasetInputFormat, GameType } from "@jetlag/shared-types";
import path from "path";
import { Worker } from "worker_threads";
import { ENV } from "~/env";
import { ExtendedError } from "../../errors";
import { logger } from "../../logger";

export type ParseDatasetWorkerData = {
	metadataId: number;
	version: number;
	gameType: GameType;
	data: DatasetInputFormat;
};

const workerPath = ENV.NODE_ENV === "production" ? "./lib/game/workers/parseDatasetWorker.js" : "parseDatasetWorker.ts";

export const dispatchParseDatasetWorker = (workerData: ParseDatasetWorkerData, apiPath: string): Promise<void> => {
	return new Promise((resolve) => {
		logger.info(
			`Dispatching ParseDatasetWorker (metadataId: ${workerData.metadataId}, version: ${workerData.version})`,
		);

		const worker = new Worker(path.resolve(__dirname, workerPath), {
			workerData,
		});

		worker.on("message", () => {
			resolve();
			logger.info(
				`ParseDatasetWorker finished (metadataId: ${workerData.metadataId}, version: ${workerData.version})`,
			);
			worker.terminate();
		});

		worker.on("error", (error) => {
			logger.error(
				new ExtendedError(
					`ParseDatasetWorker error (metadataId: ${workerData.metadataId}, version: ${workerData.version})`,
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
