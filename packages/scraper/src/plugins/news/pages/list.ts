import type { CheerioAPI } from "cheerio";

export interface NewsListItem {
	url: string;
	title: string;
	excerpt: string;
	publishedAt: Date;
}

const SELECTORS = {
	card: "article.noticia",
	link: "a.noticia__link",
	title: "h2.noticia__titulo",
	date: "span.noticia__data",
	nextPage: "a.next.page-link",
} as const;

const PT_MONTHS: Record<string, number> = {
	janeiro: 0,
	fevereiro: 1,
	março: 2,
	abril: 3,
	maio: 4,
	junho: 5,
	julho: 6,
	agosto: 7,
	setembro: 8,
	outubro: 9,
	novembro: 10,
	dezembro: 11,
};

function parsePtDate(text: string): Date {
	const match = text.trim().match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/);
	if (!match) return new Date();
	const [, day, month, year] = match;
	const monthIndex = PT_MONTHS[month?.toLowerCase() ?? ""];
	return new Date(Number(year), monthIndex ?? 0, Number(day));
}

export class NewsListPage {
	constructor(private $: CheerioAPI) {}

	extractItems(): NewsListItem[] {
		const items: NewsListItem[] = [];

		this.$(SELECTORS.card).each((_, el) => {
			const $el = this.$(el);
			const $link = $el.find(SELECTORS.link).first();

			const url = $link.attr("href") ?? "";
			if (!url) return;

			items.push({
				url,
				title: $el.find(SELECTORS.title).text().trim(),
				excerpt: "",
				publishedAt: parsePtDate($el.find(SELECTORS.date).text()),
			});
		});

		return items;
	}

	nextPageUrl(): string | null {
		return this.$(SELECTORS.nextPage).attr("href") ?? null;
	}
}
