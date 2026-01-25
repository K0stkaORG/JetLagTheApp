import { ActiveEffects, CardsInHand, Datasets, Events, Positions, RemainingCards, Users } from "../schema";
import { integer, jsonb, pgEnum, pgTable, point, timestamp } from "drizzle-orm/pg-core";

import { User } from "~/types";
import { relations } from "drizzle-orm";

export const GameState = pgEnum("game_state", ["planned", "hiding_phase", "main_phase", "paused", "finished"]);

export const Games = pgTable("games", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	datasetId: integer("dataset_id")
		.references(() => Datasets.id)
		.notNull(),
	hiders: jsonb("hiders").notNull().default([]).$type<User["id"][]>(),
	hidersTeamLeader: integer("hiders_team_leader")
		.references(() => Users.id)
		.notNull(),
	seekers: jsonb("seekers").notNull().default([]).$type<User["id"][]>(),
	state: GameState("state").notNull().default("planned"),
	startsAt: timestamp("starts_at", { mode: "date", precision: 0 }).notNull(),
	duration: integer("duration"),
	hidingSpot: point("hiding_spot", { mode: "tuple" }),
});

export const GameRelations = relations(Games, ({ one, many }) => ({
	dataset: one(Datasets, {
		fields: [Games.datasetId],
		references: [Datasets.id],
	}),
	hidersTeamLeaderUser: one(Users, {
		fields: [Games.hidersTeamLeader],
		references: [Users.id],
	}),
	activeEffects: many(ActiveEffects),
	cardsInHand: many(CardsInHand),
	positions: many(Positions),
	remainingCards: many(RemainingCards),
	events: many(Events),
}));
