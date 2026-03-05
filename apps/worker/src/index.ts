import { db } from "@ifinho/db";
import { scrapeConfigs } from "@ifinho/db/schema";
import { env } from "@ifinho/env/worker";
import { getPgBoss, type ScrapeJobData } from "@ifinho/queue";
import {
	EmbedStep,
	Fetcher,
	HashCheckStep,
	NewsScraper,
	PersistStep,
	SanitizeStep,
	ScraperRunner,
} from "@ifinho/scraper";
import { eq } from "drizzle-orm";
import { enqueueDueJobs } from "./scheduler.js";

const boss = await getPgBoss();

console.log("[Worker] pg-boss started");

await boss.createQueue("scrape");
await boss.createQueue("check-due-scrapers");

const plugins = new Map([
	["news", new NewsScraper(new Fetcher({ delayMs: 1500 }))],
]);

const pipeline = [
	new SanitizeStep(),
	new HashCheckStep(db),
	new PersistStep(db),
	new EmbedStep(db, env.OLLAMA_BASE_URL, env.OLLAMA_EMBED_MODEL),
];

const runner = new ScraperRunner(plugins, pipeline);

await boss.work<ScrapeJobData>("scrape", async (jobs) => {
	const job = jobs[0];
	if (!job) return;

	const { pluginId, configId } = job.data;

	console.log(`[Worker] Starting job: plugin=${pluginId}, config=${configId}`);

	const [config] = await db
		.select()
		.from(scrapeConfigs)
		.where(eq(scrapeConfigs.id, configId))
		.limit(1);

	if (!config || !config.enabled) {
		console.log(`[Worker] Config ${configId} not found or disabled, skipping`);
		return;
	}

	await runner.run(
		pluginId,
		{
			startUrl: config.baseUrl,
			options:
				(config.options as { maxPages?: number; delayMs?: number }) ?? {},
		},
		{
			pluginId,
			configId,
		},
	);

	console.log(`[Worker] Job completed: plugin=${pluginId}`);
});

await boss.schedule("check-due-scrapers", "*/15 * * * *");
await boss.work("check-due-scrapers", async () => {
	await enqueueDueJobs(boss);
});

await enqueueDueJobs(boss);

console.log("[Worker] Ready — listening for scrape jobs");
