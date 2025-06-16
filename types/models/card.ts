import { EffectType, Game } from ".";

type CardBase = {
    id: number;
    name: string;
    description: string;
    type:
        | "absolute_time_bonus"
        | "relative_time_bonus"
        | "curse"
        | "veto"
        | "mimic"
        | "reroll"
        | "randomize_answer"
        | "effect"
        | "error";
    data: any;
};

export type Card =
    | TimeBonusCard
    | RelativeTimeBonusCard
    | CurseCard
    | VetoCard
    | MimicCard
    | RerollCard
    | RandomizeAnswerCard
    | EffectCard
    | ErrorCard;

export type TimeBonusCard = CardBase & {
    type: "absolute_time_bonus";
    data: {
        seconds: number;
    };
};

export type RelativeTimeBonusCard = CardBase & {
    type: "relative_time_bonus";
    data: {
        percentage: number;
    };
};

export type CurseCard = CardBase & {
    type: "curse";
    data: {
        effect: EffectType;
    };
};

export type VetoCard = CardBase & {
    type: "veto";
    data: null;
};

export type MimicCard = CardBase & {
    type: "mimic";
    data: null;
};

export type RerollCard = CardBase & {
    type: "reroll";
    data: {
        throw_away: number;
        draw: number;
    };
};

export type RandomizeAnswerCard = CardBase & {
    type: "randomize_answer";
    data: null;
};

export type EffectCard = CardBase & {
    type: "effect";
    data: {
        effect: EffectType;
    };
};

export type ErrorCard = CardBase & {
    type: "error";
    data: null;
};

export type RemainingCard = {
    id: number;
    gameId: Game["id"];
    cardId: Card["id"];
    remaining: number;
};

export type CardInHand = {
    id: number;
    gameId: Game["id"];
    cardId: Card["id"];
};
