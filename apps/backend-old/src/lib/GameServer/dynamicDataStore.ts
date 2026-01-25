import { ActiveEffect, Card, CardInHand, Game, IdMap, RemainingCard } from "~/types";
import { ActiveEffects, CardsInHand, Events, Games, RemainingCards, db } from "~/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { GameServer } from "./gameServer";
import { MapById } from "../utility";
import { StaticDataStore } from "./staticDataStore";
import { SyncHandler } from "./syncHandler";

export class DynamicDataStore {
	private constructor(
		private readonly staticData: StaticDataStore,
		private _state: Game["state"],
		public lastStartedAt: number | null,
		public durationTillLastStartedAt: number,
		private readonly activeEffects: IdMap<ActiveEffect>,
		private readonly remainingCards: RemainingCard[],
		private readonly cardsInHand: CardInHand[],
		private readonly syncHandler: SyncHandler
	) {}

	public static async init({
		game,
		staticData,
		syncHandler,
	}: {
		game: { state: Game["state"]; duration: number | null };
		staticData: StaticDataStore;
		syncHandler: GameServer["syncHandler"];
	}) {
		const activeEffects = (await db.query.ActiveEffects.findMany({
			where: eq(ActiveEffects.gameId, staticData.gameId),
		})) as ActiveEffect[];

		const remainingCards = await db.query.RemainingCards.findMany({
			where: eq(RemainingCards.gameId, staticData.gameId),
		});

		const cardsInHand = await db.query.CardsInHand.findMany({
			where: eq(CardsInHand.gameId, staticData.gameId),
		});

		const lastStartedAt =
			(
				await db.query.Events.findFirst({
					where: and(
						eq(Events.gameId, staticData.gameId),
						inArray(Events.type, ["hiding_phase_started", "game_resumed"])
					),
					columns: {
						timestamp: true,
					},
					orderBy: desc(Events.timestamp),
				})
			)?.timestamp ?? null;

		return new DynamicDataStore(
			staticData,
			game.state,
			lastStartedAt?.getTime() ?? null,
			game.duration ?? 0,
			MapById(activeEffects),
			remainingCards,
			cardsInHand,
			syncHandler
		);
	}

	public get debug() {
		return {
			state: this._state,
			lastStartedAt: this.lastStartedAt ? new Date(this.lastStartedAt).toLocaleString() : null,
			durationTillLastStartedAt: this.durationTillLastStartedAt,
			fullDuration: this.getSyncedFullDuration(),
			duration: this.duration,
			activeEffects: this.activeEffects,
			remainingCards: this.remainingCards,
			cardsInHand: this.cardsInHand,
		};
	}

	public get state() {
		return this._state;
	}

	public async setState(state: Exclude<Game["state"], "planned">) {
		this._state = state;

		await db.update(Games).set({
			state,
		});

		switch (state) {
			case "hiding_phase":
				this.syncHandler.emitToAll({
					type: "hiding_phase_started",
				});
				break;
			case "main_phase":
				this.syncHandler.emitToAll({
					type: "main_phase_started",
				});
				break;
			case "finished":
				this.syncHandler.emitToAll({
					type: "game_finished",
				});
				break;
			case "paused":
				this.syncHandler.emitToAll({
					type: "game_paused",
				});
				break;
		}
	}

	public get duration() {
		return this.getSyncedFullDuration() - this.staticData.hidingTime * 60;
	}

	public get fullDuration() {
		return this.getSyncedFullDuration();
	}

	public getSyncedFullDuration(now?: number) {
		if (!this.lastStartedAt) return 0;

		if (!["hiding_phase", "main_phase"].includes(this._state)) return this.durationTillLastStartedAt;

		return Math.floor(((now ?? Date.now()) - this.lastStartedAt) / 1000) + this.durationTillLastStartedAt;
	}
}
