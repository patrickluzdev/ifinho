import { relations } from "drizzle-orm";
import {
	boolean,
	doublePrecision,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { messages } from "./conversations";
import { feedbackRatingEnum } from "./enums";

export const messageFeedback = pgTable("message_feedback", {
	id: uuid("id").primaryKey().defaultRandom(),
	messageId: uuid("message_id")
		.notNull()
		.references(() => messages.id),
	rating: feedbackRatingEnum("rating").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const queryLogs = pgTable("query_logs", {
	id: uuid("id").primaryKey().defaultRandom(),
	sessionId: text("session_id").notNull(),
	query: text("query").notNull(),
	similarityScore: doublePrecision("similarity_score"),
	hadResults: boolean("had_results").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messageFeedbackRelations = relations(
	messageFeedback,
	({ one }) => ({
		message: one(messages, {
			fields: [messageFeedback.messageId],
			references: [messages.id],
		}),
	}),
);
