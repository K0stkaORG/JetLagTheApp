import { TypedGameServer } from "@/lib/gameServer/gameServer";

import { ExtendedError } from "@/lib/errors";
import { Gamemode, IdMap, User } from "@jetlag/shared-types";
import { RoundaboutPlayer } from "./roundaboutPlayer";
import { roundaboutWorker } from "./worker";

export class RoundaboutServer extends TypedGameServer<"roundabout"> {
	declare public readonly players: IdMap<User["id"], RoundaboutPlayer>;

	public readonly worker = roundaboutWorker;

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addPlayerHook(_player: RoundaboutPlayer): Promise<void> {}

	public propagatePositionUpdate(from: RoundaboutPlayer, to: RoundaboutPlayer): boolean {
		return from === to;
	}

	protected validateGameSettingsForDataset(): void {
		if (this.gameSettings.teams.length !== this.dataset.spawns.length)
			throw new ExtendedError(
				`The number of teams in the game settings (${this.gameSettings.teams.length}) does not match the number of spawns in the dataset (${this.dataset.spawns.length}).`,
				{
					service: "gameServer",
					gameServer: this,
				},
			);
	}

	protected async onEventCallback(_event: Gamemode<"roundabout">["event"]) {}
}
