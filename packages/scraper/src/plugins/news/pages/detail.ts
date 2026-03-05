import type { CheerioAPI } from "cheerio";

const SELECTORS = {
	title: "h2.post__title",
	content: "div.post__content",
	dateMeta: 'meta[property="article:published_time"]',
} as const;

const REMOVE_SELECTORS = "script, iframe, style, .ultimos-posts, figcaption";

export class NewsDetailPage {
	constructor(private $: CheerioAPI) {}

	extractTitle(): string {
		return this.$(SELECTORS.title).first().text().trim();
	}

	extractDate(): Date | undefined {
		const content = this.$(SELECTORS.dateMeta).attr("content");
		return content ? new Date(content) : undefined;
	}

	extractContent(): string {
		const $content = this.$(SELECTORS.content).first().clone();
		$content.find(REMOVE_SELECTORS).remove();
		return $content.text().replace(/\s+/g, " ").trim();
	}
}
