import crypto from "node:crypto";
import * as cheerio from "cheerio";
import type { Fetcher } from "../../core/fetcher.js";
import type { ScrapeRequest, ScrapeResult, Scraper } from "../../core/types.js";
import { NewsDetailPage } from "./pages/detail.js";
import { NewsListPage } from "./pages/list.js";

export class NewsScraper implements Scraper {
	readonly id = "news";

	constructor(private fetcher: Fetcher) {}

	async *run(request: ScrapeRequest): AsyncGenerator<ScrapeResult> {
		const { startUrl, options } = request;
		const maxPages = options.maxPages ?? 5;

		let listUrl: string | null = startUrl;
		let page = 1;

		while (listUrl !== null && page <= maxPages) {
			console.log(`[NewsScraper] Scraping list page ${page}: ${listUrl}`);

			const html = await this.fetcher.get(listUrl);
			const $ = cheerio.load(html);
			const listPage = new NewsListPage($);
			const items = listPage.extractItems();

			for (const item of items) {
				if (!item.url) continue;

				try {
					const detailHtml = await this.fetcher.get(item.url);
					const $detail = cheerio.load(detailHtml);
					const detailPage = new NewsDetailPage($detail);

					const rawText = detailPage.extractContent();
					if (!rawText) continue;

					const contentHash = crypto
						.createHash("md5")
						.update(rawText)
						.digest("hex");

					yield {
						url: item.url,
						title: detailPage.extractTitle() || item.title,
						rawText,
						contentHash,
						category: "noticia",
						publishedAt: detailPage.extractDate() ?? item.publishedAt,
						sourceType: "webpage",
					} satisfies ScrapeResult;
				} catch (err) {
					console.error(`[NewsScraper] Failed to scrape ${item.url}:`, err);
				}
			}

			listUrl = listPage.nextPageUrl();
			page++;
		}
	}
}
