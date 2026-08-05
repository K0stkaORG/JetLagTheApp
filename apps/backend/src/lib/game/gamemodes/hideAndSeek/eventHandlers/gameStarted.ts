import { HideAndSeekServer } from "../hideAndSeekServer";

export async function onGameStarted(this: HideAndSeekServer) {
	// Schedule the start of the seeking phase after the hiding time has elapsed
	await this.eventManager.schedule({ type: "seekingPhaseStart" }, this.dataset.hideTimeSeconds);
}
