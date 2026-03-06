import axios from "axios";
import * as cheerio from "cheerio";

const url = "https://ifrs.edu.br/canoas";

async function scraper() {
	const response = await axios.get(url);
	const html = response.data;
	const posts: { title: string }[] = [];
	const $ = cheerio.load(html);

	$(".ultimos-editais a").each(function () {
		const title = $(this).find(".ultimos-editais__edital-title").text();
		posts.push({
			title,
		});
	});

	console.log({ posts });
}

scraper();
