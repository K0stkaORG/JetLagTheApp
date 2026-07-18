import { GameEvent } from "@jetlag/shared-types";
import { and, db, eq, GameEvents } from "~/db";
import { logger } from "~/lib/logger";
import { Scheduler } from "~/lib/scheduler";
import { GameServer } from "./gameServer";

type EventQueueItem<E extends GameEvent> = {
	id: number;
	event: E;
	gameTime: number;
};

export class EventManager<E extends GameEvent> {
	private readonly scheduler: Scheduler = new Scheduler();

	private constructor(
		private readonly server: GameServer,
		private readonly eventsQueue: EventQueueItem<E>[],
	) {}

	public static async load<E extends GameEvent>(server: GameServer): Promise<EventManager<E>> {
		const events = await db.query.GameEvents.findMany({
			where: and(eq(GameEvents.gameId, server.game.id), eq(GameEvents.processed, false)),
			columns: {
				id: true,
				event: true,
				gameTime: true,
			},
		});

		return new EventManager<E>(server, events as EventQueueItem<E>[]);
	}

	public async scheduleEvent(event: E, gameTime: number): Promise<void> {
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

		this.eventsQueue.push(eventQueueItem);

		this.enqueueEvent(eventQueueItem, this.server.timeline.gameTime);
	}

	private enqueueEvent({ id, event, gameTime }: EventQueueItem<E>, currentGameTime: number) {
		const executeAfter = gameTime - currentGameTime;

		if (executeAfter <= 0) {
			logger.warn(
				`Game event of type ${event.type} missed its scheduled game time of ${gameTime} by ${-executeAfter}s in game ${this.server.fullName}`,
			);

			this.server.scheduleUnattended(async () => {
				await this.server["onEventCallback"](event);

				await db.update(GameEvents).set({ processed: true }).where(eq(GameEvents.id, id));
			});
		} else
			this.scheduler.scheduleIn(executeAfter * 1000 - (Date.now() % 1000), async () => {
				await this.server.schedule(() => this.server["onEventCallback"](event));

				this.eventsQueue.splice(
					this.eventsQueue.findIndex((e) => e.id === id),
					1,
				);

				await db.update(GameEvents).set({ processed: true }).where(eq(GameEvents.id, id));
			});
	}

	public pause(): void {
		this.scheduler.clear();
	}

	public resume(currentGameTime: number): void {
		for (const event of this.eventsQueue) this.enqueueEvent(event, currentGameTime);
	}
}
