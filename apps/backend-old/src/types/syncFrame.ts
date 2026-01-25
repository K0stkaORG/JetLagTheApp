import { ActiveEffect, Card, Coordinates, GameEvent, Question, User } from ".";

type SyncFrameBase = {
	type:
		| "position"
		| "game_event"
		| "question_asked"
		| "question_answered"
		| "card_played"
		| "cards_drawn"
		| "cards_picked"
		| "effect_started"
		| "effect_ended"
		| GameEvent["type"];
	data?: any;
};

export type SeekersPositionSyncFrame = SyncFrameBase & {
	type: "position";
	data: {
		userId: User["id"];
		position: Coordinates;
	};
};

export type GameEventsSyncFrame = SyncFrameBase & {
	type: GameEvent["type"];
};

export type QuestionAskedSyncFrame = SyncFrameBase & {
	type: "question_asked";
	data: {
		questionId: Question["id"];
	};
};

export type QuestionAnsweredSyncFrame = SyncFrameBase & {
	type: "question_answered";
	data: {
		yesNo: boolean | null;
		imageUrl: string | null;
		unable: true | null;
	};
};

export type CardPlayedSyncFrame = SyncFrameBase & {
	type: "card_played";
	data: {
		cardId: Card["id"];
	};
};

export type CardsDrawnSyncFrame = SyncFrameBase & {
	type: "cards_drawn";
	data: {
		cards: Card["id"][];
		keep: number;
	};
};

export type CardsPickedSyncFrame = SyncFrameBase & {
	type: "cards_picked";
	data: {
		cards: Card["id"][];
	};
};

export type EffectStartedSyncFrame = SyncFrameBase & {
	type: "effect_started";
	data: Omit<ActiveEffect, "gameId">;
};

export type EffectEndedSyncFrame = SyncFrameBase & {
	type: "effect_ended";
	data: {
		effectId: ActiveEffect["id"];
	};
};

export type HidersSyncFrame =
	| SeekersPositionSyncFrame
	| GameEventsSyncFrame
	| QuestionAskedSyncFrame
	| QuestionAnsweredSyncFrame
	| CardPlayedSyncFrame
	| EffectStartedSyncFrame
	| EffectEndedSyncFrame;

export type SeekersSyncFrame =
	| GameEventsSyncFrame
	| QuestionAskedSyncFrame
	| QuestionAnsweredSyncFrame
	| CardPlayedSyncFrame
	| CardsDrawnSyncFrame
	| CardsPickedSyncFrame
	| EffectStartedSyncFrame
	| EffectEndedSyncFrame;
