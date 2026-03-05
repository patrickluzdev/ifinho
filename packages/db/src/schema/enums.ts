import { pgEnum } from "drizzle-orm/pg-core";

export const sourceTypeEnum = pgEnum("source_type", ["webpage", "upload"]);

export const sourceCategoryEnum = pgEnum("source_category", [
	"edital",
	"regulamento",
	"calendario",
	"noticia",
	"contato",
	"curso",
	"outro",
]);

export const sourceStatusEnum = pgEnum("source_status", [
	"pending",
	"indexing",
	"indexed",
	"outdated",
	"failed",
	"dead",
]);

export const channelEnum = pgEnum("channel", ["web", "telegram"]);

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

export const feedbackRatingEnum = pgEnum("feedback_rating", [
	"positive",
	"negative",
]);
