import { Cards, Games } from "../schema";
import { integer, pgTable } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

export const RemainingCards = pgTable("remaining_cards", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	gameId: integer("game_id")
		.notNull()
		.references(() => Games.id),
	cardId: integer("card_id")
		.notNull()
		.references(() => Cards.id),
	remaining: integer("remaining").notNull().default(0),
});

export const RemainingCardsRelations = relations(RemainingCards, ({ one }) => ({
	game: one(Games, {
		fields: [RemainingCards.gameId],
		references: [Games.id],
	}),
	card: one(Cards, {
		fields: [RemainingCards.cardId],
		references: [Cards.id],
	}),
}));
