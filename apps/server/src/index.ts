import { env } from "@ifinho/env/server";
import cors from "cors";
import express from "express";

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

// --- Chat ---

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

const getMockResponse = (question: string) =>
	`> "${question}"

Obrigado pela sua pergunta! 🎓

Ainda estou em fase de desenvolvimento, mas em breve estarei totalmente integrado ao **IFRS Campus Canoas** e poderei responder com precisão sobre:

- 📅 **Calendário acadêmico** — datas de matrícula, provas e eventos
- 📋 **Editais e programas** — PIBIC, PIBID, assistência estudantil e monitoria
- 📚 **Normas e regulamentos** — aproveitamento de estudos, trancamentos e mais
- 📄 **Documentos** — como solicitar histórico, declarações e atestados
- 🎓 **Cursos** — técnicos, graduações e pós-graduações disponíveis

---

Enquanto isso, você pode consultar o site oficial em [ifrs.edu.br/canoas](https://ifrs.edu.br/canoas) ou usar os comandos \`/ajuda\` e \`/sobre\` para mais informações.`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

app.post("/api/chat", async (req, res) => {
	const body = req.body as { message?: unknown };
	const message = body.message;

	if (typeof message !== "string" || !message.trim()) {
		res.status(400).json({ error: "message is required" });
		return;
	}

	const content =
		COMMAND_RESPONSES[message.trim().toLowerCase()] ??
		getMockResponse(message.trim());

	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");

	const tokens = content.match(/\S+\s*/g) ?? [content];

	for (const token of tokens) {
		res.write(`data: ${JSON.stringify({ token })}\n\n`);
		await sleep(20);
	}

	res.write("data: [DONE]\n\n");
	res.end();
});

app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});
