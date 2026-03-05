import crypto from "node:crypto";
import type { db as Db } from "@ifinho/db";
import { chunks, documents, sources } from "@ifinho/db/schema";
import { and, eq } from "drizzle-orm";
import { chunkText } from "../../core/chunker.js";
import type {
	PipelineContext,
	PipelineStep,
	ScrapeResult,
} from "../../core/types.js";

export class PersistStep implements PipelineStep {
	readonly name = "persist";

	constructor(private db: typeof Db) {}

	async process(
		item: ScrapeResult,
		_ctx: PipelineContext,
	): Promise<ScrapeResult> {
		await this.db.transaction(async (tx) => {
			// 1. Upsert source
			const sourceRows = await tx
				.insert(sources)
				.values({
					url: item.url,
					type: item.sourceType,
					category: item.category,
					title: item.title,
					contentHash: item.contentHash,
					status: "indexing",
					lastCheckedAt: new Date(),
					lastChangedAt: new Date(),
					failureCount: 0,
				})
				.onConflictDoUpdate({
					target: sources.url,
					set: {
						title: item.title,
						contentHash: item.contentHash,
						status: "indexing",
						lastCheckedAt: new Date(),
						lastChangedAt: new Date(),
						failureCount: 0,
					},
				})
				.returning({ id: sources.id });

			const sourceId = sourceRows[0]?.id;
			if (!sourceId) throw new Error("Failed to upsert source");

			// 2. Insert document
			const docRows = await tx
				.insert(documents)
				.values({
					sourceId,
					title: item.title,
					rawText: item.rawText,
				})
				.returning({ id: documents.id });

			const docId = docRows[0]?.id;
			if (!docId) throw new Error("Failed to insert document");

			// 3. Deactivate old chunks for this document
			await tx
				.update(chunks)
				.set({ isActive: false })
				.where(and(eq(chunks.documentId, docId), eq(chunks.isActive, true)));

			// 4. Insert new active chunks
			const textChunks = chunkText(item.rawText);
			if (textChunks.length > 0) {
				await tx.insert(chunks).values(
					textChunks.map((content, i) => ({
						documentId: docId,
						content,
						chunkIndex: i,
						isActive: true,
					})),
				);
			}

			// 5. Status stays 'indexing' — EmbedStep will set 'indexed' after embeddings
		});

		return item;
	}
}

export function computeHash(text: string): string {
	return crypto.createHash("md5").update(text).digest("hex");
}
