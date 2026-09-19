export type HideAndSeekGameEvent =
	| {
			type: "seekingPhaseStart";
	  }
	| {
			type: "questionTimeout";
			questionIndex: number;
	  };
