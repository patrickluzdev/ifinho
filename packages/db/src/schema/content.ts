import { relations } from "drizzle-orm";
import {
	boolean,
	customType,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
	dataType(config) {
		const dim = (config as { dimensions?: number })?.dimensions ?? 768;
		return `vector(${dim})`;
	},
	fromDriver(value: string) {
		return value.replace(/^\[/, "").replace(/\]$/, "").split(",").map(Number);
	},
	toDriver(value: number[]) {
		return `[${value.join(",")}]`;
	},
});

import { sourceCategoryEnum, sourceStatusEnum, sourceTypeEnum } from "./enums";

export const sources = pgTable("sources", {
	id: uuid("id").primaryKey().defaultRandom(),
	type: sourceTypeEnum("type").notNull(),
	category: sourceCategoryEnum("category").notNull(),
	url: text("url").unique(),
	filename: text("filename"),
	title: text("title"),
	contentHash: text("content_hash").notNull(),
	status: sourceStatusEnum("status").notNull().default("pending"),
	lastCheckedAt: timestamp("last_checked_at"),
	lastChangedAt: timestamp("last_changed_at"),
	failureCount: integer("failure_count").notNull().default(0),
	expiresAt: timestamp("expires_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
	id: uuid("id").primaryKey().defaultRandom(),
	sourceId: uuid("source_id")
		.notNull()
		.references(() => sources.id),
	title: text("title"),
	rawText: text("raw_text").notNull(),
	version: integer("version").notNull().default(1),
	indexedAt: timestamp("indexed_at").notNull().defaultNow(),
});

export const chunks = pgTable("chunks", {
	id: uuid("id").primaryKey().defaultRandom(),
	documentId: uuid("document_id")
		.notNull()
		.references(() => documents.id),
	content: text("content").notNull(),
	chunkIndex: integer("chunk_index").notNull(),
	isActive: boolean("is_active").notNull().default(true),
	embedding: vector("embedding", { dimensions: 768 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sourcesRelations = relations(sources, ({ many }) => ({
	documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
	source: one(sources, {
		fields: [documents.sourceId],
		references: [sources.id],
	}),
	chunks: many(chunks),
}));

export const chunksRelations = relations(chunks, ({ one }) => ({
	document: one(documents, {
		fields: [chunks.documentId],
		references: [documents.id],
	}),
}));
