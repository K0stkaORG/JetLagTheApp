import { Cards, Games } from "../schema";
import { integer, pgTable } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

export const CardsInHand = pgTable("cards_in_hand", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	gameId: integer("game_id")
		.notNull()
		.references(() => Games.id),
	cardId: integer("card_id")
		.notNull()
		.references(() => Cards.id),
});

export const CardsInHandRelations = relations(CardsInHand, ({ one }) => ({
	game: one(Games, {
		fields: [CardsInHand.gameId],
		references: [Games.id],
	}),
	card: one(Cards, {
		fields: [CardsInHand.cardId],
		references: [Cards.id],
	}),
}));
