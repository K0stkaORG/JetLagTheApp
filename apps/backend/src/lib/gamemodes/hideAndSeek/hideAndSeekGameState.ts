import { TypedGameState } from "@/lib/gameServer/gameState";
import { Gamemode } from "@jetlag/shared-types";
import { Patch } from "immer";
import { HideAndSeekPlayer } from "./hideAndSeekPlayer";
import { HideAndSeekServer } from "./hideAndSeekServer";

export class HideAndSeekGameState extends TypedGameState<"hideAndSeek"> {
	declare protected server: HideAndSeekServer;

	protected filterStateChangeForPlayer(
		player: HideAndSeekPlayer,
		patch: Gamemode<"hideAndSeek">["patch"],
	): Patch | null {
		if (patch.path[0] === "gamePhase") return patch;
		if (patch.path[0] === "questions") return patch;
		if (patch.path[0] === "unansweredQuestionIndex") return patch;
		if (patch.path[0] === "questionGracePeriodUntil") return patch;

		switch (player.team) {
			case "hiders":
				if (patch.path[0] === "hidingZoneCenterId") return patch;
				if (patch.path[0] === "hidingZone") return patch;
				if (patch.path[0] === "hidingSpot") return patch;
				if (patch.path[0] === "hand") return patch;
				break;

			case "seekers":
				if (patch.path[0] === "allPossibleHidingSpots") return patch;
				break;
		}

		return null;
	}

	protected filterStateForPlayer(
		initialState: Gamemode<"hideAndSeek">["state"],
		player: HideAndSeekPlayer,
	): Gamemode<"hideAndSeek">["state"] {
		const state = { ...initialState };

		state.gamePhase = this.state.gamePhase;
		state.questions = this.state.questions;
		state.unansweredQuestionIndex = this.state.unansweredQuestionIndex;
		state.questionGracePeriodUntil = this.state.questionGracePeriodUntil;

		switch (player.team) {
			case "hiders":
				state.hidingZoneCenterId = this.state.hidingZoneCenterId;
				state.hidingZone = this.state.hidingZone;
				state.hidingSpot = this.state.hidingSpot;
				state.hand = this.state.hand;
				break;

			case "seekers":
				state.allPossibleHidingSpots = this.state.allPossibleHidingSpots;
				break;
		}

		return state;
	}
}
