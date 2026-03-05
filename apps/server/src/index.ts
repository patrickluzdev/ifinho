import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "@ifinho/db";
import { env } from "@ifinho/env/server";
import type { ChatRequest } from "@ifinho/types";
import cors from "cors";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import express from "express";
import { Ollama } from "ollama";

const app = express();

app.use(
	cors({
		origin: env.CORS_ORIGIN,
		methods: ["GET", "POST", "OPTIONS"],
	}),
);

app.use(express.json());

app.get("/", (_req, res) => {
	res.status(200).send("OK");
});

const COMMAND_RESPONSES: Record<string, string> = {
	"/ajuda": `## 🤖 O que posso fazer por você?

Sou especialista em informações do **IFRS Campus Canoas**. Veja o que você pode me perguntar:

📅 **Calendário e prazos**
Datas de matrícula, provas, feriados e eventos acadêmicos.

📋 **Editais e bolsas**
PIBIC, PIBID, assistência estudantil, monitoria e outros programas.

📚 **Normas acadêmicas**
Regulamentos, aproveitamento de estudos, trancamentos e mais.

📄 **Documentos**
Como solicitar histórico escolar, declarações e atestados.

🎓 **Cursos**
Cursos técnicos, graduações e pós-graduações disponíveis no campus.

📞 **Contatos**
Setores, coordenações e como chegar ao campus.

---
Basta digitar sua pergunta! 💬`,

	"/sobre": `## 👋 Olá, eu sou o Ifinho!

Sou o assistente virtual do **IFRS Campus Canoas**, criado para facilitar o acesso a informações institucionais para toda a comunidade acadêmica.

### 🎯 Meu objetivo
Ajudar **alunos**, **professores** e **servidores** a encontrar informações sem precisar navegar por sites, procurar em PDFs ou enviar e-mails.

### ⚙️ Como funciono
Uso tecnologia de **busca semântica** para encontrar os trechos mais relevantes dos documentos oficiais do campus e gerar respostas precisas e contextualizadas.

### 🚧 Status atual
Estou em desenvolvimento! Em breve estarei totalmente integrado com todos os documentos oficiais do IFRS Canoas.

---
*Projeto open source desenvolvido pela comunidade do campus.* 🌱`,
};

const SYSTEM_PROMPT = `Você é o Ifinho, assistente virtual do IFRS Campus Canoas.
Responda sempre em português, de forma clara e objetiva, usando Markdown para formatar suas respostas (títulos, listas, negrito quando fizer sentido).
Use emojis com frequência para deixar as respostas mais visuais e amigáveis — em títulos, itens de lista, destaques e no início de seções. Cada item de lista deve ter um emoji relevante.
Ao citar fontes, mantenha os links Markdown exatamente como aparecem no contexto, no formato [texto](url).`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ollama = new Ollama({ host: env.OLLAMA_BASE_URL });

interface ChunkRow extends Record<string, unknown> {
	content: string;
	title: string | null;
	url: string | null;
	similarity: number;
}

async function retrieveContext(question: string): Promise<string> {
	const { embeddings } = await ollama.embed({
		model: env.OLLAMA_EMBED_MODEL,
		input: question,
	});

	const embedding = embeddings[0];
	if (!embedding) return "";

	const vectorStr = `[${embedding.join(",")}]`;

	const CHUNK_MAX_CHARS = 500;

	const result = await db.execute<ChunkRow>(sql`
		SELECT c.content, s.title, s.url,
			1 - (c.embedding <=> CAST(${vectorStr} AS vector)) AS similarity
		FROM chunks c
		JOIN documents d ON d.id = c.document_id
		JOIN sources s ON s.id = d.source_id
		WHERE c.is_active = true
			AND c.embedding IS NOT NULL
			AND s.status = 'indexed'
		ORDER BY c.embedding <=> CAST(${vectorStr} AS vector)
		LIMIT 3
	`);
	if (result.rows.length === 0) return "";

	return result.rows
		.map((r) => {
			const title = r.title ?? "Sem título";
			const url = r.url ?? "";
			const source = url ? `[${title}](${url})` : title;
			const content = r.content.slice(0, CHUNK_MAX_CHARS);
			return `**${title}**\nFonte: ${source}\n\n${content}`;
		})
		.join("\n\n---\n\n");
}

app.post("/api/chat", async (req, res) => {
	const { message } = req.body as ChatRequest;

	if (typeof message !== "string" || !message.trim()) {
		res.status(400).json({ error: "message is required" });
		return;
	}

	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");

	const trimmed = message.trim();
	const commandContent = COMMAND_RESPONSES[trimmed.toLowerCase()];

	if (commandContent) {
		const tokens = commandContent.match(/\S+\s*/g) ?? [commandContent];
		for (const token of tokens) {
			res.write(`data: ${JSON.stringify({ token })}\n\n`);
			await sleep(20);
		}
		res.write("data: [DONE]\n\n");
		res.end();
		return;
	}

	try {
		const context = await retrieveContext(trimmed);

		const systemPrompt = context
			? `${SYSTEM_PROMPT}\n\n## Informações relevantes encontradas na base de dados do IFRS Canoas:\n\n${context}\n\nUse as informações acima para responder. Se a resposta não estiver no contexto, diga que não encontrou informação sobre isso nos documentos disponíveis.`
			: SYSTEM_PROMPT;

		const stream = await ollama.chat({
			model: env.OLLAMA_MODEL,
			stream: true,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: trimmed },
			],
		});

		for await (const chunk of stream) {
			const token = chunk.message.content;
			if (token) {
				res.write(`data: ${JSON.stringify({ token })}\n\n`);
			}
		}

		res.write("data: [DONE]\n\n");
		res.end();
	} catch (error) {
		console.error("Chat error:", error);
		const message =
			error instanceof Error ? error.message : "Erro desconhecido";
		res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
		res.end();
	}
});

const migrationsFolder = join(
	fileURLToPath(
		new URL("../../../packages/db/src/migrations", import.meta.url),
	),
);
console.log(`[migrations] Running from: ${migrationsFolder}`);

const { rows: before } = await db.execute<{ hash: string }>(
	sql`SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at`,
);
const appliedBefore = new Set(before.map((r) => r.hash));

await migrate(db, { migrationsFolder });

const { rows: after } = await db.execute<{ hash: string }>(
	sql`SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at`,
);

const newlyApplied = after
	.map((r) => r.hash)
	.filter((h) => !appliedBefore.has(h));

if (newlyApplied.length === 0) {
	console.log("[migrations] No new migrations to apply.");
} else {
	for (const hash of newlyApplied) {
		console.log(`[migrations] Applied: ${hash}`);
	}
}
console.log(`[migrations] Done. Total applied: ${after.length}`);

app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});
