import { Gamemode, assertNever } from "@jetlag/shared-types";
import { RoundaboutServer } from "../roundaboutServer";
import { onGameStarted } from "./gameStarted";

export async function onEventCallback(this: RoundaboutServer, event: Gamemode<"roundabout">["event"]) {
	switch (event.type) {
		case "gameStarted":
			await onGameStarted.call(this);
			break;

		case "dummy":
			break;

		default:
			assertNever(event);
	}
}
