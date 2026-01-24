import { GameServer } from "../gameServer";

export class RoundaboutServer extends GameServer {
	protected async startHook(): Promise<void> {}

	protected async shutdownHook(): Promise<void> {}
}
