import type { CheerioAPI } from "cheerio";

export interface CursoListItem {
	url: string;
	title: string;
}

const SELECTORS = {
	link: "div.page__content ul li a",
} as const;

export class CursoListPage {
	constructor(private $: CheerioAPI) {}

	extractItems(): CursoListItem[] {
		const seen = new Set<string>();
		const items: CursoListItem[] = [];

		this.$(SELECTORS.link).each((_, el) => {
			const $el = this.$(el);
			const url = $el.attr("href") ?? "";

			// Ignora se não for URL HTTP ou se já foi visto
			if (!url.startsWith("https://ifrs.edu.br") || seen.has(url)) return;

			seen.add(url);
			items.push({
				url,
				title: $el.text().trim(),
			});
		});

		return items;
	}

	nextPageUrl(): string | null {
		return null;
	}
}
