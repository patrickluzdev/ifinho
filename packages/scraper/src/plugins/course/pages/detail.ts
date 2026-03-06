import type { CheerioAPI } from "cheerio";

const SELECTORS = {
	title: "h2.page__title",
	content: "div.page__content",
	dateMeta: "p.page__meta",
} as const;

const REMOVE_SELECTORS = "script, iframe, style, nav, footer";

export class CursoDetailPage {
	constructor(private $: CheerioAPI) {}

	extractTitle(): string {
		return this.$(SELECTORS.title).first().text().trim();
	}

	extractDate(): Date | undefined {
		const text = this.$(SELECTORS.dateMeta).first().text();
		// Formato: "Última atualização em 20/02/2026"
		const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
		if (!match) return undefined;
		const [, day, month, year] = match;
		return new Date(Number(year), Number(month) - 1, Number(day));
	}

	extractContent(): string {
		const $content = this.$(SELECTORS.content).first().clone();
		$content.find(REMOVE_SELECTORS).remove();
		return $content.text().replace(/\s+/g, " ").trim();
	}
}
