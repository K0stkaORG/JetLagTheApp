import type { GameState } from "@/context/SocketContext";
import type { GetDatasetResponse, HideAndSeekDatasetSaveFormat, Question, User } from "@jetlag/shared-types";
import { getQuestionsMap } from "@jetlag/shared-types";

export type Team = "hiders" | "seekers";

/**
 * A single entry in the question/answer activity log shown in the UI.
 * The server currently relays question/answer activity over `general.notification`,
 * so the log is derived from the notification stream (see SocketContext).
 */
export type QuestionLogEntry = {
	id: string;
	/** The question/answer text. */
	text: string;
	/** Optional name of the question this entry relates to. */
	questionName?: string;
	timestamp: number;
};

/**
 * Parse the questions for a Hide and Seek dataset into a flat list with stable ids.
 * Returns an empty list for non-hideAndSeek datasets or when parsing fails.
 */
export function getQuestionsList(dataset: GetDatasetResponse | undefined): { id: number; question: Question }[] {
	if (!dataset) return [];
	const data = dataset.data as HideAndSeekDatasetSaveFormat;
	if (!data || typeof data !== "object" || !("questions" in data) || !("gameArea" in data)) return [];

	try {
		const map = getQuestionsMap(data);
		return map.map((question, id) => ({ id, question }));
	} catch {
		return [];
	}
}

/**
 * Determine the local player's team.
 *
 * The backend filters the per-player state so that only hiders ever receive the
 * `hidingSpot` (see hideAndSeekGameState). We primarily use the game settings'
 * `hiders` nickname list, and fall back to `hidingSpot` visibility.
 */
export function getTeam(
	gameState: GameState | null,
	user: User | null,
): { team: Team; gamePhase: "hiding" | "seeking" | null } {
	const state = gameState?.state as Partial<HideAndSeekDatasetSaveFormat> &
		Partial<{ gamePhase: "hiding" | "seeking"; hidingSpot: unknown }>;
	const gamePhase = state?.gamePhase === "seeking" ? "seeking" : state?.gamePhase === "hiding" ? "hiding" : null;

	let team: Team = "seekers";

	const hiders = (gameState?.settings as { hiders?: unknown } | undefined)?.hiders;
	if (user && Array.isArray(hiders) && hiders.every((h) => typeof h === "string")) {
		team = (hiders as string[]).includes(user.nickname) ? "hiders" : "seekers";
	} else if (state && "hidingSpot" in state && state.hidingSpot != null) {
		// Only hiders receive the hiding spot from the server.
		team = "hiders";
	}

	return { team, gamePhase };
}
