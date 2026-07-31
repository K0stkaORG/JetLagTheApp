import { parseDataset } from "@jetlag/shared-types";
import { parentPort, workerData } from "node:worker_threads";
import { Datasets, db } from "~/db";
import { ParseDatasetWorkerData } from "./dispatchParseDatasetWorker";

const main = async () => {
	const { metadataId, version, gameType, data } = workerData as ParseDatasetWorkerData;

	const parsed = parseDataset(gameType, data);

	await db.insert(Datasets).values({
		metadataId,
		version,
		input: data,
		parsed,
		latest: true,
	});

	parentPort?.postMessage(true);
};

main();
