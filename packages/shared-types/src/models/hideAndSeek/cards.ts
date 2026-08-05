import { IdMap } from "../../utility/idMap";
import { pluralize } from "../../utility/pluralize";
import { HideAndSeekDatasetInputFormat } from "./dataset";

export type Card = {
	name: string;
	description: string;
	type: "curse" | "timeBonus" | "rerollCards" | "veto" | "increaseHandSize" | "mimic";
} & (
	| { type: "curse" }
	| { type: "timeBonus"; seconds: number }
	| { type: "rerollCards"; discard: number; draw: number }
	| { type: "veto" }
	| { type: "increaseHandSize" }
	| { type: "mimic" }
);

const getUnitName = (unit: "s" | "m" | "h", amount: number) => {
	switch (unit) {
		case "s":
			return pluralize(amount, "second", "seconds");
		case "m":
			return pluralize(amount, "minute", "minutes");
		case "h":
			return pluralize(amount, "hour", "hours");
	}
};

export const getCardsMap = (dataset: Pick<HideAndSeekDatasetInputFormat, "cards">): IdMap<number, Card> => {
	const map = new IdMap<number, Card>();

	let cardId = 0;

	for (const timeBonus of dataset.cards.timeBonus) {
		const unitName = getUnitName(timeBonus.units, timeBonus.amount);

		const card: Card = {
			name: `${timeBonus.amount} ${unitName} bonus`,
			description: `If in hand at the end of the game, you gain ${timeBonus.amount} bonus ${unitName}`,
			type: "timeBonus",
			seconds: timeBonus.amount * { s: 1, m: 60, h: 3600 }[timeBonus.units],
		};

		for (let i = 0; i < timeBonus.amount; i++) map.set(cardId++, card);
	}

	for (const rerollCards of dataset.cards.rerollCards) {
		const card: Card = {
			name: `Discard ${rerollCards.discard}, Draw ${rerollCards.draw}`,
			description: `When played, discard ${rerollCards.discard} and draw ${rerollCards.draw} ${pluralize(rerollCards.draw, "card", "cards")}`,
			type: "rerollCards",
			discard: rerollCards.discard,
			draw: rerollCards.draw,
		};

		for (let i = 0; i < rerollCards.amount; i++) map.set(cardId++, card);
	}

	for (let i = 0; i < dataset.cards.veto; i++) {
		const card: Card = {
			name: "Veto",
			description:
				"When played, the current question is vetoed. You do not get any cards from the deck but the cost of the question is increased.",
			type: "veto",
		};

		map.set(cardId++, card);
	}

	for (let i = 0; i < dataset.cards.increaseHandSize; i++) {
		const card: Card = {
			name: "Increase Hand Size",
			description: "When played, increase your hand size by 1",
			type: "increaseHandSize",
		};

		map.set(cardId++, card);
	}

	for (let i = 0; i < dataset.cards.mimic; i++) {
		const card: Card = {
			name: "Mimic",
			description: "When played, you can duplicate a card in your hand",
			type: "mimic",
		};

		map.set(cardId++, card);
	}

	return map;
};
