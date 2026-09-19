import { assertNever, Gamemode } from "@jetlag/shared-types";
import { HideAndSeekServer } from "../hideAndSeekServer";
import { onGameStarted } from "./gameStarted";
import { onQuestionTimeout } from "./questionTimeout";
import { onSeekingPhaseStart } from "./seekingPhaseStart";

export async function onEventCallback(this: HideAndSeekServer, event: Gamemode<"hideAndSeek">["event"]) {
	switch (event.type) {
		case "gameStarted":
			await onGameStarted.call(this);
			break;

		case "seekingPhaseStart":
			await onSeekingPhaseStart.call(this);
			break;

		case "questionTimeout":
			await onQuestionTimeout.call(this, event.questionIndex);
			break;

		default:
			assertNever(event);
	}
}
