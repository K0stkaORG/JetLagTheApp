import { parseDataset } from "@jetlag/shared-types";
import { parentPort, workerData } from "node:worker_threads";
import { and, Datasets, db, eq, ne } from "~/db";
import { ParseDatasetWorkerData } from "./dispatchParseDatasetWorker";

const main = async () => {
	const { datasetId, metadataId, gameType, data } = workerData as ParseDatasetWorkerData;

	try {
		const parsed = parseDataset(gameType, data);

		// Mark all other versions for this metadata as outdated
		await db
			.update(Datasets)
			.set({ state: "outdated" })
			.where(and(eq(Datasets.metadataId, metadataId), ne(Datasets.id, datasetId), eq(Datasets.state, "latest")));

		// Update this dataset to latest with parsed data
		await db.update(Datasets).set({ state: "latest", parsed }).where(eq(Datasets.id, datasetId));

		parentPort?.postMessage({ success: true });
	} catch {
		await db.update(Datasets).set({ state: "errored" }).where(eq(Datasets.id, datasetId));
		parentPort?.postMessage({ success: false });
	}
};

main();
