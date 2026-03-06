import crypto from "node:crypto";
import * as cheerio from "cheerio";
import type { Fetcher } from "../../core/fetcher.js";
import type { ScrapeRequest, ScrapeResult, Scraper } from "../../core/types.js";
import { CursoDetailPage } from "./pages/detail.js";
import { CursoListPage } from "./pages/list.js";

export class CursosScraper implements Scraper {
	readonly id = "cursos-ifrs-canoas";

	constructor(private fetcher: Fetcher) {}

	async *run(request: ScrapeRequest): AsyncGenerator<ScrapeResult> {
		const { startUrl } = request;

		console.log(`[CursosScraper] Buscando lista em: ${startUrl}`);

		const html = await this.fetcher.get(startUrl);
		const $ = cheerio.load(html);
		const listPage = new CursoListPage($);
		const items = listPage.extractItems();

		console.log(`[CursosScraper] ${items.length} cursos encontrados`);

		for (const item of items) {
			if (!item.url) continue;

			try {
				console.log(`[CursosScraper] Scraping: ${item.title}`);

				const detailHtml = await this.fetcher.get(item.url);
				const $detail = cheerio.load(detailHtml);
				const detailPage = new CursoDetailPage($detail);

				const rawText = detailPage.extractContent();
				if (!rawText) continue;

				yield {
					url: item.url,
					title: detailPage.extractTitle() || item.title,
					rawText,
					contentHash: crypto.createHash("md5").update(rawText).digest("hex"),
					category: "curso",
					publishedAt: detailPage.extractDate(),
					sourceType: "webpage",
				} satisfies ScrapeResult;
			} catch (err) {
				console.error(`[CursosScraper] Erro em ${item.url}:`, err);
			}
		}
	}
}
