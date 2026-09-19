import { TypedGameState } from "@/lib/gameServer/gameState";
import { Gamemode } from "@jetlag/shared-types";
import { Patch } from "immer";
import { RoundaboutPlayer } from "./roundaboutPlayer";
import { RoundaboutServer } from "./roundaboutServer";

export class RoundaboutGameState extends TypedGameState<"roundabout"> {
	declare protected server: RoundaboutServer;

	protected filterStateChangeForPlayer(
		_player: RoundaboutPlayer,
		_patch: Gamemode<"roundabout">["patch"],
	): Patch | null {
		return null;
	}

	protected filterStateForPlayer(
		initialState: Gamemode<"roundabout">["state"],
		_player: RoundaboutPlayer,
	): Gamemode<"roundabout">["state"] {
		return initialState;
	}
}
