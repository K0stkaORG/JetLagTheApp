export class FifoMutex {
	private nextTicket = 0;
	private currentTicket = 0;
	private waiters = new Map<number, () => void>();

	// Tracks total active + queued tasks
	private activeCount = 0;

	// Resolvers waiting for activeCount to reach 0
	private idleWaiters: (() => void)[] = [];

	/**
	 * Acquires the lock. Resolves once all prior callers have released the lock.
	 */
	public async lock(): Promise<() => void> {
		// Increment total work in flight
		this.activeCount++;

		const ticket = this.nextTicket++;

		if (ticket !== this.currentTicket) await new Promise<void>((resolve) => this.waiters.set(ticket, resolve));

		let released = false;
		return () => {
			if (released) return;
			released = true;

			this.currentTicket++;

			const next = this.waiters.get(this.currentTicket);
			if (next) {
				this.waiters.delete(this.currentTicket);
				next();
			}

			// Decrement work count and notify idle waiters if everything is done
			this.activeCount--;
			if (this.activeCount === 0) this.notifyIdle();
		};
	}

	/**
	 * Executes an asynchronous function within the protection of the lock.
	 */
	public async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
		const release = await this.lock();

		try {
			return await fn();
		} finally {
			release();
		}
	}

	/**
	 * Returns a Promise that resolves when all current and queued tasks have finished
	 */
	public async waitForIdle(): Promise<void> {
		// If nothing is running or queued, resolve immediately
		if (this.activeCount === 0) return;

		return new Promise<void>((resolve) => {
			this.idleWaiters.push(resolve);
		});
	}

	private notifyIdle(): void {
		const waiters = [...this.idleWaiters];
		this.idleWaiters = [];

		for (const resolve of waiters) resolve();
	}
}
