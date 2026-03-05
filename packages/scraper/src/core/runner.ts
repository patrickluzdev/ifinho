import type {
	PipelineContext,
	PipelineStep,
	ScrapeRequest,
	ScrapeResult,
	Scraper,
} from "./types.js";

export class ScraperRunner {
	constructor(
		private plugins: Map<string, Scraper>,
		private pipeline: PipelineStep[],
	) {}

	async run(
		pluginId: string,
		request: ScrapeRequest,
		ctx: PipelineContext,
	): Promise<void> {
		const plugin = this.plugins.get(pluginId);
		if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

		for await (const item of plugin.run(request)) {
			await this.processThroughPipeline(item, ctx);
		}
	}

	private async processThroughPipeline(
		item: ScrapeResult,
		ctx: PipelineContext,
	): Promise<void> {
		let current: ScrapeResult | null = item;

		for (const step of this.pipeline) {
			if (!current) break;
			try {
				current = await step.process(current, ctx);
			} catch (err) {
				console.error(`[${step.name}] Error processing ${item.url}:`, err);
				current = null;
			}
		}
	}
}
