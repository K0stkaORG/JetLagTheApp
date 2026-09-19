import { ENV } from "@/env";
import { cpus } from "os";
import path from "path";
import Piscina from "piscina";

const workerPath =
	ENV.NODE_ENV === "production"
		? path.resolve(__dirname, "./lib/workers/gameWorker.js")
		: path.resolve(__dirname, "./gameWorker.ts");

let poolInstance: Piscina | null = null;

export const workerPool = (): Piscina => {
	if (!poolInstance)
		poolInstance = new Piscina({
			filename: workerPath,
			minThreads: 1,
			maxThreads: Math.max(2, cpus().length - 1),
			idleTimeout: 300_000,
		});

	return poolInstance;
};
