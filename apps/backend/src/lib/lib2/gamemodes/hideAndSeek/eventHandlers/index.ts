import { HideAndSeekGameEvent } from "@jetlag/shared-types";
import { HideAndSeekServer } from "../hideAndSeekServer";
import { onGameStarted } from "./gameStarted";
import { onSeekingPhaseStart } from "./seekingPhaseStart";

export async function onEventCallback(this: HideAndSeekServer, event: HideAndSeekGameEvent) {
	switch (event.type) {
		case "gameStarted":
			await onGameStarted.call(this);
			break;

		case "seekingPhaseStart":
			await onSeekingPhaseStart.call(this);
			break;
	}
}
