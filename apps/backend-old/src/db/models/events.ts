import { integer, pgEnum, pgTable, timestamp } from "drizzle-orm/pg-core";

import { Games } from "../schema";
import { relations } from "drizzle-orm";

export const EventType = pgEnum("event_type", [
	"hiding_phase_started",
	"main_phase_started",
	"game_paused",
	"game_resumed",
	"game_finished",
]);

export const Events = pgTable("events", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	gameId: integer("game_id")
		.notNull()
		.references(() => Games.id),
	timestamp: timestamp("timestamp", { mode: "date", precision: 0 }).defaultNow().notNull(),
	type: EventType("type").notNull(),
});

export const EventRelations = relations(Events, ({ one }) => ({
	game: one(Games, {
		fields: [Events.gameId],
		references: [Games.id],
	}),
}));
