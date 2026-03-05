interface ChunkOptions {
	chunkSize?: number;
	overlap?: number;
}

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
	const { chunkSize = 500, overlap = 50 } = options;

	const words = text.split(/\s+/).filter(Boolean);

	if (words.length <= chunkSize) {
		return [text];
	}

	const chunks: string[] = [];
	let start = 0;

	while (start < words.length) {
		const end = Math.min(start + chunkSize, words.length);
		chunks.push(words.slice(start, end).join(" "));

		if (end === words.length) break;
		start += chunkSize - overlap;
	}

	return chunks;
}
