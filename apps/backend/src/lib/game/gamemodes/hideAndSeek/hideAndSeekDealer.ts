import { shuffle } from "@jetlag/shared-types";
import { UserRequestError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { HideAndSeekServer } from "./hideAndSeekServer";

type CardId = number;

export class HideAndSeekDealer {
	public constructor(private readonly server: HideAndSeekServer) {}

	public async draw(numberOfCards: number): Promise<CardId[]> {
		if (this.server.state.get.offeredCards)
			throw new UserRequestError(`Cannot draw cards while there are still uncommitted offered cards.`);

		if (numberOfCards <= 0) throw new UserRequestError(`Number of cards to draw must be greater than 0`);

		if (numberOfCards > this.server.dataset.cards.ids.length)
			throw new UserRequestError(
				`Cannot draw ${numberOfCards} cards. The deck only has ${this.server.dataset.cards.count} cards.`,
			);

		if (numberOfCards > this.server.state.get.drawDeck.length) {
			logger.info(`Not enough cards in deck in game ${this.server.fullName}. Reshuffling...`);

			await this.server.state.updateNow((state) => {
				state.drawDeck = this.server.dataset.cards.ids as number[];
			});
		}

		const offer = shuffle(this.server.state.get.drawDeck).slice(0, numberOfCards);

		await this.server.state.updateNow((state) => {
			state.offeredCards = offer;
		});

		return offer;
	}

	public async commit(picked: CardId[]) {
		if (!this.server.state.get.offeredCards)
			throw new UserRequestError(`Cannot commit cards when there are no offered cards.`);

		const deduplicated = new Set(picked);

		if (deduplicated.size !== picked.length)
			throw new UserRequestError(`Cannot commit duplicate cards. Please only commit each card once.`);

		for (const card of deduplicated)
			if (!this.server.state.get.offeredCards.includes(card))
				throw new UserRequestError(`Cannot commit card ${card} because it was not offered.`);

		await this.server.state.updateNow((state) => {
			state.drawDeck = state.drawDeck.filter((card) => !deduplicated.has(card));
			state.offeredCards = null;
			state.hand.push(...deduplicated);
		});
	}
}
