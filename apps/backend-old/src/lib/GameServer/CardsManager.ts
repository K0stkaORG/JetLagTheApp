import { DataStore } from "./dataStore";

export class CardsManager {
	public constructor(private readonly data: DataStore) {}

	// public drawNCards(numberOfCards: number): Card["id"][] {
	// 	const drawnCards: Card["id"][] = [];
	// 	const cards = this.remainingCards.filter((card) => card.remaining > 0);

	// 	let total = cards.reduce((sum, card) => sum + card.remaining, 0);

	// 	for (let i = 0; i < numberOfCards && total > 0; i++) {
	// 		let r = Math.floor(Math.random() * total);
	// 		let acc = 0;
	// 		for (const card of cards) {
	// 			acc += card.remaining;
	// 			if (r < acc) {
	// 				drawnCards.push(card.id);
	// 				card.remaining--;
	// 				total--;
	// 				break;
	// 			}
	// 		}
	// 	}

	// 	return drawnCards;
	// }

	// public async pickCardsFromDrawn(pickedCards: Card["id"][]) {
	// 	await db.insert(CardsInHand).values(
	// 		pickedCards.map((cardId) => ({
	// 			gameId: this.data.id,
	// 			cardId,
	// 		}))
	// 	);

	// 	await Promise.allSettled(
	// 		pickedCards
	// 			.reduce((acc, cardId) => {
	// 				const existing = acc.find((item) => item.id === cardId);
	// 				if (existing) {
	// 					existing.amount++;
	// 				} else {
	// 					acc.push({ id: cardId, amount: 1 });
	// 				}
	// 				return acc;
	// 			}, [] as { id: Card["id"]; amount: number }[])
	// 			.map(({ id, amount }) => {
	// 				return db
	// 					.update(RemainingCards)
	// 					.set({ remaining: sql`${RemainingCards.remaining} - ${amount}` })
	// 					.where(and(eq(RemainingCards.gameId, this.staticData.gameId), eq(RemainingCards.id, id)));
	// 			})
	// 	);

	// 	this.syncHandler.emitToSeekers({
	// 		type: "cards_picked",
	// 		data: {
	// 			cards: pickedCards,
	// 		},
	// 	});
	// }
}
