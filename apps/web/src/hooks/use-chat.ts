import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { GenerationStage, MessageData } from "@/types/chat";

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

export function useChat() {
	const [messages, setMessages] = useState<MessageData[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [generationStage, setGenerationStage] =
		useState<GenerationStage>("idle");
	const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
		null,
	);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Streams fullContent word by word into an existing message.
	// While streaming: isLoading stays true, generationStage stays idle (hides status indicator).
	const streamContent = (
		messageId: string,
		fullContent: string,
		onDone: () => void,
		intervalMs = 25,
	) => {
		setStreamingMessageId(messageId);
		// Split preserving words + trailing whitespace as individual tokens
		const tokens = fullContent.match(/\S+\s*/g) ?? [fullContent];
		let index = 0;

		intervalRef.current = setInterval(() => {
			index++;
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === messageId
						? { ...msg, content: tokens.slice(0, index).join("") }
						: msg,
				),
			);

			if (index >= tokens.length) {
				clearInterval(intervalRef.current!);
				intervalRef.current = null;
				setStreamingMessageId(null);
				// Guarantee exact final content
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === messageId ? { ...msg, content: fullContent } : msg,
					),
				);
				onDone();
			}
		}, intervalMs);
	};

	const startResponse = (
		fullContent: string,
		onDone?: () => void,
		intervalMs = 25,
	) => {
		const msgId = (Date.now() + 1).toString();
		// Add empty message — streaming will fill it in
		setMessages((prev) => [
			...prev,
			{ id: msgId, content: "", sender: "assistant" },
		]);
		// Hide the generation status indicator while streaming
		setGenerationStage("idle");

		streamContent(
			msgId,
			fullContent,
			() => {
				setIsLoading(false);
				onDone?.();
			},
			intervalMs,
		);
	};

	const handleSend = (content: string) => {
		const userMessage: MessageData = {
			id: Date.now().toString(),
			content,
			sender: "user",
		};
		setMessages((prev) => [...prev, userMessage]);

		const commandResponse = COMMAND_RESPONSES[content.toLowerCase()];
		if (commandResponse) {
			setIsLoading(true);
			setGenerationStage("thinking");
			timeoutRef.current = setTimeout(() => {
				setGenerationStage("responding");
				timeoutRef.current = setTimeout(() => {
					timeoutRef.current = null;
					startResponse(commandResponse, undefined, 15);
				}, 600);
			}, 600);
			return;
		}

		setIsLoading(true);
		setGenerationStage("thinking");

		timeoutRef.current = setTimeout(() => {
			setGenerationStage("searching");
			timeoutRef.current = setTimeout(() => {
				setGenerationStage("responding");
				timeoutRef.current = setTimeout(() => {
					timeoutRef.current = null;
					startResponse(getMockResponse(content));
				}, 1000);
			}, 1500);
		}, 1500);
	};

	const handleStop = () => {
		// Streaming in progress — stop and keep partial content
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
			setStreamingMessageId(null);
			setIsLoading(false);
			setGenerationStage("idle");
			return;
		}
		// Still in thinking/searching/responding stages
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					content: `> Geração interrompida pelo usuário.

A resposta foi cancelada antes de ser concluída. Você pode reenviar a mensagem ou fazer uma nova pergunta.`,
					sender: "assistant",
				},
			]);
			setIsLoading(false);
			setGenerationStage("idle");
		}
	};

	const handleEdit = (id: string, content: string) => {
		setMessages((prev) =>
			prev.map((msg) => (msg.id === id ? { ...msg, content } : msg)),
		);
	};

	const handleRetry = (id: string) => {
		const messageIndex = messages.findIndex((msg) => msg.id === id);
		if (messageIndex < 0) return;

		const userMessage = messages[messageIndex];
		const nextAssistant = messages.find(
			(msg, i) => i > messageIndex && msg.sender === "assistant",
		);

		setMessages((prev) =>
			nextAssistant ? prev.filter((msg) => msg.id !== nextAssistant.id) : prev,
		);
		setIsLoading(true);
		setGenerationStage("thinking");

		timeoutRef.current = setTimeout(() => {
			setGenerationStage("searching");
			timeoutRef.current = setTimeout(() => {
				setGenerationStage("responding");
				timeoutRef.current = setTimeout(() => {
					timeoutRef.current = null;
					startResponse(getMockResponse(userMessage.content), () => {
						toast.success("Mensagem reenviada", { duration: 3000 });
					});
				}, 1000);
			}, 1500);
		}, 1500);
	};

	const handleRegenerate = (id: string) => {
		const messageIndex = messages.findIndex((msg) => msg.id === id);
		if (messageIndex < 0) return;

		let userMessageIndex = messageIndex - 1;
		while (
			userMessageIndex >= 0 &&
			messages[userMessageIndex].sender !== "user"
		) {
			userMessageIndex--;
		}

		if (userMessageIndex < 0) return;

		const userMessage = messages[userMessageIndex];
		setMessages((prev) => prev.filter((msg) => msg.id !== id));
		setIsLoading(true);
		setGenerationStage("thinking");

		timeoutRef.current = setTimeout(() => {
			setGenerationStage("searching");
			timeoutRef.current = setTimeout(() => {
				setGenerationStage("responding");
				timeoutRef.current = setTimeout(() => {
					timeoutRef.current = null;
					startResponse(getMockResponse(userMessage.content), () => {
						toast.success("Resposta regenerada", { duration: 3000 });
					});
				}, 1000);
			}, 1500);
		}, 1500);
	};

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	return {
		messages,
		isLoading,
		generationStage,
		streamingMessageId,
		handleSend,
		handleStop,
		handleEdit,
		handleRetry,
		handleRegenerate,
	};
}
