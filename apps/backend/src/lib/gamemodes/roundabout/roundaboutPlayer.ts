import { TypedPlayer } from "@/lib/gameServer/player";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutPlayer extends TypedPlayer<"roundabout"> {
	declare protected readonly server: RoundaboutServer;

	protected registerSocketEventListenersHook(): void {}
}
