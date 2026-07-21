import { AsyncLocalStorage } from "node:async_hooks";
import { ExtendedError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { GameServer } from "./gameServer";

const MS_BETWEEN_TICKS = 50;

type QueueItem<T> = {
	tag: string;
	command: () => T;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: unknown) => void;
};

export class CommandQueue {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private queue: QueueItem<any>[] = [];
	private isRunning = false;
	private stopResolver: (() => void) | null = null;

	private asyncStorage = new AsyncLocalStorage<string>();

	constructor(private readonly server: GameServer) {}

	public async enqueue<T>(tag: string, command: () => T): Promise<T> {
		if (this.asyncStorage.getStore())
			throw new ExtendedError(
				`Deadlock protection tripped: A command (${this.asyncStorage.getStore()}) execution attempted to synchronously enqueue another command ${tag} on the same server.`,
				{
					service: "gameServer",
					gameServer: this.server,
				},
			);

		if (!this.isRunning)
			throw new ExtendedError(`Failed to enqueue command ${tag}, CommandQueue is not running`, {
				service: "gameServer",
				gameServer: this.server,
			});

		return new Promise<T>((resolve, reject) => {
			this.queue.push({ tag, command, resolve, reject });
		});
	}

	public enqueueUnattended(tag: string, command: () => void) {
		if (!this.isRunning)
			throw new ExtendedError(`Failed to enqueue command ${tag}, CommandQueue is not running`, {
				service: "gameServer",
				gameServer: this.server,
			});

		this.queue.push({
			tag,
			command,
			resolve: () => {},
			reject: (error) => {
				throw new ExtendedError(`Unattended command (${tag}) execution failed`, {
					service: "gameServer",
					gameServer: this.server,
					error,
				});
			},
		});
	}

	public start() {
		if (this.isRunning) return;

		this.isRunning = true;

		this.tick();
	}

	public async stop(): Promise<void> {
		if (!this.isRunning) return;

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
				item.resolve(await this.asyncStorage.run(item.tag, item.command));
			} catch (error) {
				item.reject(
					new ExtendedError(`Error processing command ${item.tag}`, {
						service: "gameServer",
						gameServer: this.server,
						error,
					}),
				);
			}

		const elapsedTime = Date.now() - startTime;
		const delay = Math.max(0, MS_BETWEEN_TICKS - elapsedTime);

		if (elapsedTime > MS_BETWEEN_TICKS)
			logger.warn(
				`CommandQueue (server ${this.server.fullName}) tick with ${items.length} ${items.length > 1 ? "commands" : "command"} (${items.map((i) => i.tag).join(", ")}) took ${elapsedTime}ms (max ${MS_BETWEEN_TICKS}ms)`,
			);

		if (this.isRunning) {
			setTimeout(() => this.tick(), delay);
		} else {
			if (this.stopResolver) this.stopResolver();
			else
				throw new ExtendedError("CommandQueue stopped without a resolver", {
					service: "gameServer",
					gameServer: this.server,
				});
		}
	}
}
