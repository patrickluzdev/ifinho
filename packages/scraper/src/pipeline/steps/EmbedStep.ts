import type { db as Db } from "@ifinho/db";
import { chunks, documents, sources } from "@ifinho/db/schema";
import { and, desc, eq } from "drizzle-orm";
import type {
	PipelineContext,
	PipelineStep,
	ScrapeResult,
} from "../../core/types.js";

export class EmbedStep implements PipelineStep {
	readonly name = "embed";

	constructor(
		private db: typeof Db,
		private ollamaUrl: string,
		private model: string,
	) {}

	async process(
		item: ScrapeResult,
		_ctx: PipelineContext,
	): Promise<ScrapeResult> {
		const [source] = await this.db
			.select({ id: sources.id })
			.from(sources)
			.where(eq(sources.url, item.url))
			.limit(1);

		if (!source) return item;

		const [doc] = await this.db
			.select({ id: documents.id })
			.from(documents)
			.where(eq(documents.sourceId, source.id))
			.orderBy(desc(documents.indexedAt))
			.limit(1);

		if (!doc) return item;

		const activeChunks = await this.db
			.select({ id: chunks.id, content: chunks.content })
			.from(chunks)
			.where(and(eq(chunks.documentId, doc.id), eq(chunks.isActive, true)));

		for (const chunk of activeChunks) {
			const embedding = await this.generateEmbedding(chunk.content);
			await this.db
				.update(chunks)
				.set({ embedding })
				.where(eq(chunks.id, chunk.id));
		}

		await this.db
			.update(sources)
			.set({ status: "indexed" })
			.where(eq(sources.id, source.id));

		console.log(
			`[EmbedStep] Embedded ${activeChunks.length} chunks for ${item.url}`,
		);
		return item;
	}

	private async generateEmbedding(text: string): Promise<number[]> {
		const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ model: this.model, prompt: text }),
		});

		if (!response.ok) {
			throw new Error(
				`Ollama embeddings failed: ${response.status} ${response.statusText}`,
			);
		}

		const data = (await response.json()) as { embedding: number[] };
		return data.embedding;
	}
}
