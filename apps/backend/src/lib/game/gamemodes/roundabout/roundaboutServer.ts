import { GameServer } from "../../gameServer/gameServer";
import { RoundaboutPlayer } from "./roundaboutPlayer";

export class RoundaboutServer extends GameServer {
	public readonly players: Map<number, RoundaboutPlayer> = new Map();

	protected async startHook(): Promise<void> {}

	protected async stopHook(): Promise<void> {}

	protected async addUserAccessHook(_player: RoundaboutPlayer): Promise<void> {}
}
