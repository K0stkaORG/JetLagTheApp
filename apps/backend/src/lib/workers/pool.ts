import { ENV } from "@/env";
import { cpus } from "os";
import path from "path";
import Piscina from "piscina";

const workerPath =
	ENV.NODE_ENV === "production"
		? path.resolve(__dirname, "./lib/workers/gameWorker.js")
		: path.resolve(__dirname, "./gameWorker.ts");

export const workerPool: Piscina = new Piscina({
	filename: workerPath,
	minThreads: 0,
	maxThreads: Math.max(2, cpus().length - 1),
	idleTimeout: 300_000,
});
