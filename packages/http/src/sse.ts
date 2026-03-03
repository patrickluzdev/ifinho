import { EventSourceParserStream } from "eventsource-parser/stream";

export async function* streamSSE(
	url: string,
	body: unknown,
	signal?: AbortSignal,
): AsyncGenerator<string> {
	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		signal,
	});

	if (!response.ok || !response.body) {
		throw new Error(`HTTP ${response.status}`);
	}

	const stream = response.body
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(new EventSourceParserStream());

	for await (const event of stream) {
		if (event.data === "[DONE]") break;
		const parsed = JSON.parse(event.data) as { token: string };
		yield parsed.token;
	}
}
