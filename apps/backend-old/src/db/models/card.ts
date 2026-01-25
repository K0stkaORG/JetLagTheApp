import { CardsInHand, RemainingCards } from "../schema";
import { integer, jsonb, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";

import { Card } from "~/types";
import { relations } from "drizzle-orm";

export const CardType = pgEnum("card_type", ["absolute_time_bonus", "relative_time_bonus", "curse", "veto", "mimic", "reroll", "randomize_answer"]);

export const Cards = pgTable("cards", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: varchar("name", { length: 63 }).notNull(),
	description: varchar("description", { length: 255 }).notNull(),
	type: CardType("type").notNull(),
	data: jsonb("data").notNull().$type<Card["data"]>(),
});

export const CardsRelations = relations(Cards, ({ many }) => ({
	cardsInHand: many(CardsInHand),
	remainingInGame: many(RemainingCards),
}));
