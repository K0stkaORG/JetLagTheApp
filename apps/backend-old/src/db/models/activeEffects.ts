import { integer, jsonb, pgEnum, pgTable } from "drizzle-orm/pg-core";

import { ActiveEffect } from "~/types";
import { Games } from "./game";
import { relations } from "drizzle-orm";

export const EffectType = pgEnum("effect_type", [
	"bonus_cards",
	"gamblers_feet",
	"blindfold",
	"question_bridge",
	"free_question",
]);

export const ActiveEffects = pgTable("effects", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	gameId: integer("game_id")
		.notNull()
		.references(() => Games.id),
	type: EffectType("type").notNull(),
	data: jsonb("data").notNull().default({}).$type<ActiveEffect["data"]>(),
});

export const ActiveEffectRelations = relations(ActiveEffects, ({ one }) => ({
	game: one(Games, {
		fields: [ActiveEffects.gameId],
		references: [Games.id],
	}),
}));
