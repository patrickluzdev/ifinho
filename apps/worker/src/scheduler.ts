import { db } from "@ifinho/db";
import { scrapeConfigs } from "@ifinho/db/schema";
import type { ScrapeJobData } from "@ifinho/queue";
import { and, eq, sql } from "drizzle-orm";
import type PgBoss from "pg-boss";

export async function enqueueDueJobs(boss: PgBoss): Promise<void> {
	const now = new Date();

	const due = await db
		.select()
		.from(scrapeConfigs)
		.where(
			and(
				eq(scrapeConfigs.enabled, true),
				sql`NOT EXISTS (
          SELECT 1 FROM sources s
          WHERE s.url = ${scrapeConfigs.baseUrl}
          AND s.last_checked_at + (${scrapeConfigs.checkIntervalMinutes} * INTERVAL '1 minute') > ${now}
        )`,
			),
		);

	for (const config of due) {
		const jobData: ScrapeJobData = {
			pluginId: config.pluginId,
			configId: config.id,
		};

		await boss.send("scrape", jobData, {
			priority: config.priority,
			retryLimit: 3,
			retryDelay: 60,
			singletonKey: config.id,
		});

		console.log(`[Scheduler] Enqueued scrape job for config: ${config.name}`);
	}
}
