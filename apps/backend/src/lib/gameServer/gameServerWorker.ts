import { GameType } from "@jetlag/shared-types";
import { workerPool } from "../workers/pool";

export type JobHandler<TInput, TOutput> = (data: TInput) => Promise<TOutput> | TOutput;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JobHandlersRecord = Record<string, JobHandler<any, any>>;

export class GameServerWorker<
	TGameType extends GameType = GameType,
	THandlers extends JobHandlersRecord = JobHandlersRecord,
> {
	constructor(
		public readonly gameType: TGameType,
		public readonly handlers: THandlers,
	) {}

	public async run<K extends keyof THandlers & string>(
		jobType: K,
		data: Parameters<THandlers[K]>[0],
	): Promise<Awaited<ReturnType<THandlers[K]>>> {
		return workerPool().run({
			gameType: this.gameType,
			jobType,
			data,
		}) as Awaited<ReturnType<THandlers[K]>>;
	}

	public async handleJob(jobType: string, data: unknown): Promise<unknown> {
		const handler = this.handlers[jobType];

		if (!handler) throw new Error(`Unsupported worker job: ${jobType}`);

		return handler(data);
	}
}
