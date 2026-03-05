import {
	boolean,
	integer,
	json,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { sourceCategoryEnum } from "./enums";

export const scrapeConfigs = pgTable("scrape_configs", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	pluginId: text("plugin_id").notNull(),
	category: sourceCategoryEnum("category").notNull(),
	baseUrl: text("base_url").notNull(),
	options: json("options").notNull(),
	priority: integer("priority").notNull().default(5),
	checkIntervalMinutes: integer("check_interval_minutes").notNull(),
	enabled: boolean("enabled").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
