import type {
	PipelineContext,
	PipelineStep,
	ScrapeResult,
} from "../../core/types.js";

export class SanitizeStep implements PipelineStep {
	readonly name = "sanitize";

	async process(
		item: ScrapeResult,
		_ctx: PipelineContext,
	): Promise<ScrapeResult> {
		return {
			...item,
			title: this.clean(item.title),
			rawText: this.clean(item.rawText),
		};
	}

	private clean(text: string): string {
		return text
			.replace(/\u00A0/g, " ")
			.replace(/[\u200B-\u200D\uFEFF]/g, "")
			.replace(/\s+/g, " ")
			.trim();
	}
}
