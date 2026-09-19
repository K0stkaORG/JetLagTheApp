import { TypedGameServer } from "@/lib/gameServer/gameServer";

import { IdMap, User } from "@jetlag/shared-types";
import { onEventCallback } from "./eventHandlers";
import { HideAndSeekDealer } from "./hideAndSeekDealer";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";
import { hideAndSeekWorker } from "./worker";

export class HideAndSeekServer extends TypedGameServer<"hideAndSeek"> {
	declare public readonly players: IdMap<User["id"], HideAndSeekPlayer>;

	public readonly worker = hideAndSeekWorker;

	public readonly dealer = new HideAndSeekDealer(this);

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addPlayerHook(_player: HideAndSeekPlayer): Promise<void> {}

	public propagatePositionUpdate(from: HideAndSeekPlayer, to: HideAndSeekPlayer): boolean {
		// Seeker ----> Hider
		//   /|\          |
		//    |          \|/
		// Seeker <-/-- Hider

		return from.team === "seekers" || to.team === "hiders";
	}

	protected validateGameSettingsForDataset(): void {}

	protected onEventCallback = onEventCallback;
}
