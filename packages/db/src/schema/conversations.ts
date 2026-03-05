import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { channelEnum, messageRoleEnum } from "./enums";
import { messageFeedback } from "./quality";

export const conversations = pgTable("conversations", {
	id: uuid("id").primaryKey().defaultRandom(),
	sessionId: text("session_id").notNull(),
	channel: channelEnum("channel").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
	id: uuid("id").primaryKey().defaultRandom(),
	conversationId: uuid("conversation_id")
		.notNull()
		.references(() => conversations.id),
	role: messageRoleEnum("role").notNull(),
	content: text("content").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversationsRelations = relations(conversations, ({ many }) => ({
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id],
	}),
	feedback: many(messageFeedback),
}));
