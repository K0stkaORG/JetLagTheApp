import { BaseGameEvent, Gamemode, Gamemodes, GameTime, GameType } from "@jetlag/shared-types";
import { and, asc, db, eq, GameEvents } from "~/db";
import { logger } from "~/lib/logger";
import { Scheduler } from "~/lib/scheduler";
import type { GameServer } from "./gameServer";

type EventStoreItem<TEvent extends Gamemodes["event"]> = {
	id: number;
	event: TEvent;
	gameTime: GameTime;
};

export class EventManager {
	private readonly scheduler: Scheduler = new Scheduler();

	private constructor(
		private readonly server: GameServer,
		private readonly eventsStore: EventStoreItem<BaseGameEvent>[],
	) {}

	public static async load(server: GameServer): Promise<EventManager> {
		const events = await db.query.GameEvents.findMany({
			where: and(eq(GameEvents.gameId, server.game.id), eq(GameEvents.processed, false)),
			columns: {
				id: true,
				event: true,
				gameTime: true,
			},
			orderBy: asc(GameEvents.gameTime),
		});

		return new EventManager(server, events as EventStoreItem<BaseGameEvent>[]);
	}

	public async schedule(event: BaseGameEvent, gameTime: GameTime) {
		const id = (
			await db
				.insert(GameEvents)
				.values({
					gameId: this.server.game.id,
					event,
					gameTime,
				})
				.returning({ id: GameEvents.id })
		)[0].id;

		const eventQueueItem = { id, event, gameTime };

		this.eventsStore.push(eventQueueItem);

		this.enqueue(eventQueueItem);
	}

	private enqueue({ id, event, gameTime }: EventStoreItem<BaseGameEvent>) {
		const delayMs = gameTime - this.server.timeline.gameTime;

		if (delayMs <= 0) {
			logger.warn(
				`Game event of type ${event.type} (server ${this.server.fullName}) missed its scheduled game time of ${gameTime / 1000}s by ${-delayMs}ms`,
			);

			this.server.scheduleUnattended(`DelayedEventHandler(${event.type})`, async () => {
				await this.handleEvent(event);

				this.eventsStore.splice(
					this.eventsStore.findIndex((e) => e.id === id),
					1,
				);

				await db.update(GameEvents).set({ processed: true }).where(eq(GameEvents.id, id));
			});
		} else
			this.scheduler.scheduleIn(delayMs, async () => {
				await this.server.schedule(`EventHandler(${event.type})`, () => this.handleEvent(event));

				this.eventsStore.splice(
					this.eventsStore.findIndex((e) => e.id === id),
					1,
				);

				await db.update(GameEvents).set({ processed: true }).where(eq(GameEvents.id, id));
			});
	}

	private async handleEvent(event: BaseGameEvent): Promise<void> {
		if (event.type === "gameStarted") this.server.timeline.handleGameStarted();

		await this.server["onEventCallback"](event);
	}

	public pause(): void {
		this.scheduler.clear();
	}

	public resume(): void {
		for (const event of this.eventsStore) this.enqueue(event);
	}
}

export interface TypedEventManager<T extends GameType> extends EventManager {
	schedule(event: Gamemode<T>["event"], gameTime: GameTime): Promise<void>;
}
