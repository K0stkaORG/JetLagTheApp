import { integer, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";

export const QuestionType = pgEnum("question_type", ["radar", "thermometer", "photo", "matching"]);

export const Questions = pgTable("questions", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: varchar("name", { length: 63 }).notNull(),
	description: varchar("description", { length: 255 }).notNull(),
	type: QuestionType("type").notNull(),
	price_draw: integer("price_draw").notNull().default(0),
	price_keep: integer("price_answer").notNull().default(0),
});
