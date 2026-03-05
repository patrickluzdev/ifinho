import axios from "axios";

interface FetcherOptions {
	delayMs?: number;
	timeoutMs?: number;
	userAgent?: string;
}

const DEFAULT_USER_AGENT =
	"Ifinho-Bot/1.0 (+https://github.com/patrickluzdev/ifinho; educational project)";

export class Fetcher {
	private lastRequestAt = 0;
	private readonly delayMs: number;
	private readonly timeoutMs: number;
	private readonly userAgent: string;

	constructor(options: FetcherOptions = {}) {
		this.delayMs = options.delayMs ?? 1500;
		this.timeoutMs = options.timeoutMs ?? 15_000;
		this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
	}

	async get(url: string): Promise<string> {
		await this.rateLimit();

		const response = await axios.get<string>(url, {
			headers: { "User-Agent": this.userAgent },
			timeout: this.timeoutMs,
			responseType: "text",
		});

		this.lastRequestAt = Date.now();
		return response.data;
	}

	private async rateLimit(): Promise<void> {
		const elapsed = Date.now() - this.lastRequestAt;
		const wait = this.delayMs - elapsed;

		if (wait > 0) {
			await new Promise((resolve) => setTimeout(resolve, wait));
		}
	}
}
