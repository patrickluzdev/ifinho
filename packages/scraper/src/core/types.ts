import type { sourceCategoryEnum, sourceTypeEnum } from "@ifinho/db/schema";

export type SourceCategory = (typeof sourceCategoryEnum.enumValues)[number];
export type SourceType = (typeof sourceTypeEnum.enumValues)[number];

export interface ScrapeResult {
	url: string;
	title: string;
	rawText: string;
	contentHash: string;
	category: SourceCategory;
	publishedAt?: Date;
	sourceType: SourceType;
	metadata?: Record<string, unknown>;
}

export interface ScrapeOptions {
	maxPages?: number;
	delayMs?: number;
}

export interface ScrapeRequest {
	startUrl: string;
	options: ScrapeOptions;
}

export interface Scraper {
	readonly id: string;
	run(request: ScrapeRequest): AsyncGenerator<ScrapeResult>;
}

export interface PipelineContext {
	pluginId: string;
	configId: string;
}

export interface PipelineStep {
	readonly name: string;
	process(
		item: ScrapeResult,
		ctx: PipelineContext,
	): Promise<ScrapeResult | null>;
}
