import { Player } from "../../gameServer/player";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutPlayer extends Player {
	declare protected readonly server: RoundaboutServer;

	protected registerSocketEventListenersHook(): void {}
}
