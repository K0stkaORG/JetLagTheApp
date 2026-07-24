import { UniversalGameEvents } from "../shared/eventsBase";

export type HideAndSeekGameEvent =
	| UniversalGameEvents
	| {
			type: "seekingPhaseStart";
	  };
