import { AsyncLocalStorage } from "node:async_hooks";
import { ExtendedError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { GameServer } from "./gameServer";

const MS_BETWEEN_TICKS = 50;

type QueueItem<T> = {
	command: () => T;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: unknown) => void;
};

export class CommandQueue {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private queue: QueueItem<any>[] = [];
	private isRunning = false;
	private stopResolver: (() => void) | null = null;

	private asyncStorage = new AsyncLocalStorage<boolean>();

	constructor(private readonly server: GameServer) {}

	public async enqueue<T>(command: () => T): Promise<T> {
		if (this.asyncStorage.getStore() === true)
			throw new ExtendedError(
				"Deadlock protection tripped: A command execution attempted to synchronously enqueue another command on the same server.",
				{
					service: "gameServer",
					gameServer: this.server,
				},
			);

		if (!this.isRunning)
			throw new ExtendedError("CommandQueue is not running. Please start the queue before enqueueing commands.", {
				service: "gameServer",
				gameServer: this.server,
			});

		return new Promise<T>((resolve, reject) => {
			this.queue.push({ command, resolve, reject });
		});
	}

	public enqueueUnattended(command: () => void) {
		if (!this.isRunning)
			throw new ExtendedError("CommandQueue is not running. Please start the queue before enqueueing commands.", {
				service: "gameServer",
				gameServer: this.server,
			});

		this.queue.push({ command, resolve: () => {}, reject: () => {} });
	}

	public start() {
		if (this.isRunning) return;

		this.isRunning = true;

		this.tick();
	}

	public async stop(): Promise<void> {
		return new Promise((resolve) => {
			this.stopResolver = resolve;
			this.isRunning = false;
		});
	}

	protected async tick() {
		const startTime = Date.now();

		const items = this.queue;
		this.queue = [];

		for await (const item of items)
			try {
				item.resolve(await this.asyncStorage.run(true, item.command));
			} catch (error) {
				logger.error(
					new ExtendedError(`Error processing command`, {
						service: "gameServer",
						gameServer: this.server,
						error,
					}),
				);

				item.reject(error);
			}

		const elapsedTime = Date.now() - startTime;
		const delay = Math.max(0, MS_BETWEEN_TICKS - elapsedTime);

		if (elapsedTime > MS_BETWEEN_TICKS)
			logger.warn(
				`CommandQueue tick with ${items.length} commands took ${elapsedTime}ms (max ${MS_BETWEEN_TICKS}ms). Game server: ${this.server.fullName}`,
			);

		if (this.isRunning) {
			setTimeout(() => this.tick(), delay);
		} else {
			if (this.stopResolver) this.stopResolver();
			else
				logger.error(
					new ExtendedError("CommandQueue stopped without a resolver", {
						service: "gameServer",
						gameServer: this.server,
					}),
				);
		}
	}
}
