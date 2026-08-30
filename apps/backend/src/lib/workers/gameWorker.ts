/**
 * Unified Game Worker
 *
 * Single worker thread entry point for all game server background computations.
 */

import "source-map-support/register";
import { GameType } from "@jetlag/shared-types";
import { hideAndSeekWorker } from "../gamemodes/hideAndSeek/worker";
import { roundaboutWorker } from "../gamemodes/roundabout/worker";

export type GameJobPayload<TData = unknown> = {
	gameType: GameType;
	jobType: string;
	data: TData;
};

export default async function handleGameJob({ gameType, jobType, data }: GameJobPayload): Promise<unknown> {
	switch (gameType) {
		case "hideAndSeek":
			return hideAndSeekWorker.handleJob(jobType, data);

		case "roundabout":
			return roundaboutWorker.handleJob(jobType, data);

		default:
			throw new Error(`Unsupported game type in worker: ${gameType}`);
	}
}
