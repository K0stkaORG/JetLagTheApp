import { AsyncLocalStorage } from "node:async_hooks";
import { ExtendedError } from "~/lib/errors";
import { FifoMutex } from "../fifoMutex";
import type { GameServer } from "./gameServer";

export class CommandQueue {
	private isRunning = false;
	private executingTag: string | null = null;

	private readonly mutex = new FifoMutex();
	private readonly asyncStorage = new AsyncLocalStorage<string>();

	constructor(private readonly server: GameServer) {}

	public start(): void {
		this.isRunning = true;
	}

	public async stop(): Promise<void> {
		if (!this.isRunning) return;

		// 1. Prevent new incoming commands from being enqueued
		this.isRunning = false;

		// 2. Deterministically await all in-flight and queued commands to complete
		await this.mutex.waitForIdle();
	}

	public async enqueue<T>(tag: string, command: () => T | PromiseLike<T>): Promise<T> {
		this.assertIsRunning(tag);
		this.assertNoDeadlock(tag);

		try {
			return await this.mutex.runExclusive(async () => {
				this.executingTag = tag;

				try {
					return await this.asyncStorage.run(tag, () => command());
				} finally {
					this.executingTag = null;
				}
			});
		} catch (error) {
			throw new ExtendedError(`Error processing command ${tag}`, {
				service: "gameServer",
				gameServer: this.server,
				error,
			});
		}
	}

	public enqueueUnattended(tag: string, command: () => void | PromiseLike<void>): void {
		this.assertIsRunning(tag);

		this.mutex.runExclusive(async () => {
			this.executingTag = tag;
			try {
				await this.asyncStorage.run(tag, () => command());
			} catch (error) {
				throw new ExtendedError(`Unattended command (${tag}) execution failed`, {
					service: "gameServer",
					gameServer: this.server,
					error,
				});
			} finally {
				this.executingTag = null;
			}
		});
	}

	private assertIsRunning(tag: string): void {
		if (!this.isRunning)
			throw new ExtendedError(`Failed to enqueue command ${tag}, CommandQueue is not running`, {
				service: "gameServer",
				gameServer: this.server,
			});
	}

	private assertNoDeadlock(tag: string): void {
		const contextTag = this.asyncStorage.getStore();

		if (contextTag && contextTag === this.executingTag)
			throw new ExtendedError(
				`Deadlock protection tripped: A command (${contextTag}) execution attempted to synchronously enqueue another command ${tag} on the same server.`,
				{
					service: "gameServer",
					gameServer: this.server,
				},
			);
	}
}
