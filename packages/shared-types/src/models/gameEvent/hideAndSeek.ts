import { UniversalGameEvents } from "./shared";

export type HideAndSeekGameEvent =
	| UniversalGameEvents
	| {
			type: "seekingPhaseStart";
	  };
