import { Game, Question, QuestionType } from ".";

export type EffectType =
	| "bonus_cards"
	| "gamblers_feet"
	| "blindfold"
	| "question_bridge"
	| "free_question"
	| "questions_disabled"
	| "question_type_disabled"; // Todo: Add remaining effects

type ActiveEffectBase = {
	id: number;
	gameId: Game["id"];
	type: EffectType;
};

export type BonusCardsEffect = ActiveEffectBase & {
	type: "bonus_cards";
	data: {
		usesRemaining: number;
	};
};

export type GamblersFeetEffect = ActiveEffectBase & {
	type: "gamblers_feet";
	data: {
		endsAt: Date;
	};
};

export type BlindfoldEffect = ActiveEffectBase & {
	type: "blindfold";
	data: {
		endsAt: Date;
	};
};

export type QuestionBridgeEffect = ActiveEffectBase & {
	type: "question_bridge";
	data: {
		usesRemaining: number;
	};
};

export type FreeQuestionEffect = ActiveEffectBase & {
	type: "free_question";
	data: {
		usesRemaining: number;
	};
};

export type QuestionsDisabledEffect = ActiveEffectBase & {
	type: "questions_disabled";
	data: {
		questionIds: Question["id"][];
	};
};

export type QuestionTypeDisabledEffect = ActiveEffectBase & {
	type: "question_category_disabled";
	data: {
		questionType: QuestionType;
		usesLeft: number;
	};
};

export type ActiveEffect =
	| BonusCardsEffect
	| GamblersFeetEffect
	| BlindfoldEffect
	| QuestionBridgeEffect
	| FreeQuestionEffect
	| QuestionsDisabledEffect
	| QuestionTypeDisabledEffect;
