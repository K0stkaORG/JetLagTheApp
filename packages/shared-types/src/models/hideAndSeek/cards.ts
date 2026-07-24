import { IdMap } from "../../utility/idMap";
import { HideAndSeekDatasetSaveFormat } from "./dataset";

export type Card = {
	name: string;
	description: string;
	type: "curse" | "timeBonus" | "rerollCards" | "veto" | "increaseHandSize";
} & (
	| { type: "curse" }
	| { type: "timeBonus"; seconds: number }
	| { type: "rerollCards"; discard: number; draw: number }
	| { type: "veto" }
	| { type: "increaseHandSize" }
);

export const getCardsMap = (dataset: Pick<HideAndSeekDatasetSaveFormat, "cards">): IdMap<number, Card> => {
	const map = new IdMap<number, Card>();

	let cardId = 0;

	for (const timeBonus of dataset.cards.timeBonus) {
		const card: Card = {
			name: `${timeBonus.amount} ${
				{
					s: "seconds",
					m: "minutes",
					h: "hours",
				}[timeBonus.units]
			} bonus`,
			description: `If in hand at the end of the game, you gain ${timeBonus.amount} bonus ${
				{
					s: "seconds",
					m: "minutes",
					h: "hours",
				}[timeBonus.units]
			}`,
			type: "timeBonus",
			seconds: timeBonus.amount * { s: 1, m: 60, h: 3600 }[timeBonus.units],
		};

		for (let i = 0; i < timeBonus.amount; i++) map.set(cardId++, card);
	}

	for (const rerollCards of dataset.cards.rerollCards) {
		const card: Card = {
			name: `Discard ${rerollCards.discard}, Draw ${rerollCards.draw}`,
			description: `When played, discard ${rerollCards.discard} and draw ${rerollCards.draw} cards`,
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

	return map;
};
