import { GameEvent } from "@jetlag/shared-types";
import { and, asc, db, eq, GameEvents } from "~/db";
import { logger } from "~/lib/logger";
import { Scheduler } from "~/lib/scheduler";
import { GameServer } from "./gameServer";

type EventStoreItem<E extends GameEvent> = {
	id: number;
	event: E;
	gameTime: number;
};

export class EventManager<E extends GameEvent> {
	private readonly scheduler: Scheduler = new Scheduler();

	private constructor(
		private readonly server: GameServer,
		private readonly eventsStore: EventStoreItem<E>[],
	) {}

	public static async load<E extends GameEvent>(server: GameServer): Promise<EventManager<E>> {
		const events = await db.query.GameEvents.findMany({
			where: and(eq(GameEvents.gameId, server.game.id), eq(GameEvents.processed, false)),
			columns: {
				id: true,
				event: true,
				gameTime: true,
			},
			orderBy: asc(GameEvents.gameTime),
		});

		return new EventManager<E>(server, events as EventStoreItem<E>[]);
	}

	public async schedule(event: E, gameTime: number) {
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

		this.enqueue(eventQueueItem, this.server.timeline.gameTime);
	}

	private enqueue({ id, event, gameTime }: EventStoreItem<E>, currentGameTime: number) {
		const executeAfter = gameTime - currentGameTime;

		if (executeAfter <= 0) {
			logger.warn(
				`Game event of type ${event.type} (server ${this.server.fullName}) missed its scheduled game time of ${gameTime} by ${-executeAfter}s`,
			);

			this.server.scheduleUnattended(`DelayedEventHandler(${event.type})`, async () => {
				await this.server["onEventCallback"](event);

				this.eventsStore.splice(
					this.eventsStore.findIndex((e) => e.id === id),
					1,
				);

				await db.update(GameEvents).set({ processed: true }).where(eq(GameEvents.id, id));
			});
		} else
			this.scheduler.scheduleIn(executeAfter * 1000 - (Date.now() % 1000), async () => {
				await this.server.schedule(`EventHandler(${event.type})`, () => this.server["onEventCallback"](event));

				this.eventsStore.splice(
					this.eventsStore.findIndex((e) => e.id === id),
					1,
				);

				await db.update(GameEvents).set({ processed: true }).where(eq(GameEvents.id, id));
			});
	}

	public pause(): void {
		this.scheduler.clear();
	}

	public resume(currentGameTime: number): void {
		for (const event of this.eventsStore) this.enqueue(event, currentGameTime);
	}
}
