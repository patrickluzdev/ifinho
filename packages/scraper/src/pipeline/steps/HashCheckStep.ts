import type { db as Db } from "@ifinho/db";
import { sources } from "@ifinho/db/schema";
import { eq } from "drizzle-orm";
import type {
	PipelineContext,
	PipelineStep,
	ScrapeResult,
} from "../../core/types.js";

export class HashCheckStep implements PipelineStep {
	readonly name = "hash-check";

	constructor(private db: typeof Db) {}

	async process(
		item: ScrapeResult,
		_ctx: PipelineContext,
	): Promise<ScrapeResult | null> {
		const existing = await this.db
			.select({ contentHash: sources.contentHash })
			.from(sources)
			.where(eq(sources.url, item.url))
			.limit(1);

		if (existing.length === 0) {
			return item;
		}

		if (existing[0]?.contentHash === item.contentHash) {
			await this.db
				.update(sources)
				.set({ lastCheckedAt: new Date() })
				.where(eq(sources.url, item.url));

			return null;
		}

		return item;
	}
}
