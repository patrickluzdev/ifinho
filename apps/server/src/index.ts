import { env } from "@ifinho/env/server";
import cors from "cors";
import express from "express";
import { chatQueue } from "./queue";
import "./worker";
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
Responda sempre em português, de forma clara e objetiva, usando Markdown para formatar suas respostas (títulos, listas, negrito quando fizer sentido). Use emojis com frequência para deixar as respostas mais visuais e amigáveis — em títulos, itens de lista, destaques e no início de seções.`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ollama = new Ollama({ host: env.OLLAMA_BASE_URL });

app.post("/api/chat", async (req, res) => {
	const body = req.body as { message?: unknown };
	const message = body.message;

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
		const stream = await ollama.chat({
			model: env.OLLAMA_MODEL,
			stream: true,
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
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
		console.error("Ollama error:", error);
		const message =
			error instanceof Error ? error.message : "Erro desconhecido";
		res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
		res.end();
	}
});

app.post("/api/queue", async (req, res) => {
	const { message } = req.body;

	await chatQueue.add("chat-message", { message });

	res.status(200).json({ ok: true });
});

app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});
