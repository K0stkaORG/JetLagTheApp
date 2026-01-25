import { Events, Games, db } from "~/db";

import { DataStore } from "./dataStore";
import { eq } from "drizzle-orm";
import { io } from "../io";

export class PhaseManager {
	public constructor(private readonly data: DataStore) {}

	private get secondsAlignedNow() {
		const now = Date.now();

		return now - (now % 1000);
	}

	public async tick() {
		const shouldHidingPhaseBeStarted = this.data.startsAt.getTime() <= Date.now() && this.data.state === "planned";

		if (shouldHidingPhaseBeStarted) {
			io.server.log(
				{
					id: this.data.id,
					type: "HideAndSeek",
				},
				`Started hiding phase`
			);

			return await this.startHidingPhase();
		}

		const shouldMainPhaseBeStarted =
			this.data.state === "hiding_phase" && this.data.fullDuration >= this.data.dataset.hidingTime * 60;

		if (shouldMainPhaseBeStarted) {
			io.server.log(
				{
					id: this.data.id,
					type: "HideAndSeek",
				},
				`Started main phase`
			);

			return await this.startMainPhase();
		}
	}

	public async startHidingPhase() {
		await this.data.setState("hiding_phase");

		this.data.lastStartedAt = this.secondsAlignedNow;
		await db.insert(Events).values([
			{
				gameId: this.data.id,
				type: "hiding_phase_started",
				timestamp: new Date(this.data.lastStartedAt),
			},
		]);
	}

	public async startMainPhase() {
		await this.data.setState("main_phase");
	}

	public async pause() {
		if (!["hiding_phase", "main_phase"].includes(this.data.state))
			throw new Error("Hra není ve fázi, kterou lze pozastavit.");

		io.server.log(
			{
				id: this.data.id,
				type: "HideAndSeek",
			},
			`Paused game`
		);

		const now = this.secondsAlignedNow;

		this.data.durationTillLastStartedAt = this.data.getSyncedFullDuration(now);

		await this.data.setState("paused");

		await db.insert(Events).values([{ gameId: this.data.id, type: "game_paused", timestamp: new Date(now) }]);
		await db
			.update(Games)
			.set({
				duration: this.data.durationTillLastStartedAt,
			})
			.where(eq(Games.id, this.data.id));
	}

	public async resume() {
		if (this.data.state !== "paused") throw new Error("Hra není pozastavena.");

		io.server.log(
			{
				id: this.data.id,
				type: "HideAndSeek",
			},
			`Resumed game`
		);

		const resumedState =
			this.data.fullDuration >= this.data.dataset.hidingTime * 60 ? "main_phase" : "hiding_phase";

		await this.data.setState(resumedState);

		this.data.lastStartedAt = this.secondsAlignedNow;

		await db.insert(Events).values([
			{
				gameId: this.data.id,
				type: "game_resumed",
				timestamp: new Date(this.data.lastStartedAt),
			},
		]);

		return resumedState;
	}
}
