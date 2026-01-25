export class Scheduler {
	private priorityQueue: Array<{ time: number; callback: () => void }> = [];
	private timerId: NodeJS.Timeout | null = null;

	public constructor() {}

	public scheduleAt(time: number, callback: () => Promise<void>): void {
		const task = { time, callback };

		for (let i = 1; i < this.priorityQueue.length; i++)
			if (time < this.priorityQueue[i].time) {
				this.priorityQueue.splice(i, 0, task);
				return;
			}

		this.priorityQueue.unshift(task);

		this.scheduleNext();
	}

	public scheduleIn(delay: number, callback: () => Promise<void>): void {
		this.scheduleAt(Date.now() + delay, callback);
	}

	private scheduleNext(): void {
		if (this.timerId !== null) clearTimeout(this.timerId);
		this.timerId = null;

		if (this.priorityQueue.length === 0) return;

		const nextTask = this.priorityQueue[0];

		const delay = Math.max(0, nextTask.time - Date.now());
		this.timerId = setTimeout(() => this.executeNext(), delay);
	}

	private async executeNext(): Promise<void> {
		if (this.priorityQueue.length === 0) return;

		while (this.priorityQueue.length > 0 && this.priorityQueue[0].time <= Date.now())
			await this.priorityQueue.shift()!.callback();

		this.scheduleNext();
	}

	public clear(): void {
		if (this.timerId !== null) clearTimeout(this.timerId);
		this.timerId = null;
		this.priorityQueue = [];
	}
}
