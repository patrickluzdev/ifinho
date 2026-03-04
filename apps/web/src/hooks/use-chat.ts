import { env } from "@ifinho/env/web";
import { streamSSE } from "@ifinho/http";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { GenerationStage, MessageData } from "@/types/chat";

const SERVER_URL = env.VITE_SERVER_URL;

export function useChat() {
	const [messages, setMessages] = useState<MessageData[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [generationStage, setGenerationStage] =
		useState<GenerationStage>("idle");
	const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
		null,
	);
	const abortRef = useRef<AbortController | null>(null);

	const sendMessage = useCallback(
		async (content: string, onDone?: () => void) => {
			const msgId = (Date.now() + 1).toString();
			setGenerationStage("thinking");
			abortRef.current = new AbortController();

			const sentAt = Date.now();

			try {
				let firstToken = true;
				for await (const token of streamSSE(
					`${SERVER_URL}/api/chat`,
					{ message: content },
					abortRef.current.signal,
				)) {
					if (firstToken) {
						const elapsed = Date.now() - sentAt;
						const MIN_DELAY = 400;
						if (elapsed < MIN_DELAY) {
							await new Promise<void>((r) =>
								setTimeout(r, MIN_DELAY - elapsed),
							);
						}
						setGenerationStage("idle");
						setMessages((prev) => [
							...prev,
							{ id: msgId, content: token, sender: "assistant" },
						]);
						setStreamingMessageId(msgId);
						firstToken = false;
					} else {
						setMessages((prev) =>
							prev.map((msg) =>
								msg.id === msgId
									? { ...msg, content: msg.content + token }
									: msg,
							),
						);
					}
				}
			} catch (err) {
				if ((err as Error).name === "AbortError") return;
				const isHttpError = (err as Error).message.startsWith("HTTP");
				const errorContent = isHttpError
					? "## 🔌 Servidor indisponível\n\nNão foi possível conectar com o servidor no momento.\n\nVerifique sua conexão e tente novamente."
					: "## 😔 Algo deu errado\n\nNão consegui gerar uma resposta agora.\n\nTente novamente em alguns instantes. Se o problema persistir, verifique se o serviço está funcionando normalmente.";
				setMessages((prev) => {
					const exists = prev.some((m) => m.id === msgId);
					if (exists) {
						return prev.map((msg) =>
							msg.id === msgId ? { ...msg, content: errorContent } : msg,
						);
					}
					return [
						...prev,
						{ id: msgId, content: errorContent, sender: "assistant" },
					];
				});
			} finally {
				abortRef.current = null;
				setStreamingMessageId(null);
				setIsLoading(false);
				setGenerationStage("idle");
				onDone?.();
			}
		},
		[],
	);

	const handleSend = (content: string) => {
		const userMessage: MessageData = {
			id: Date.now().toString(),
			content,
			sender: "user",
		};
		setMessages((prev) => [...prev, userMessage]);
		setIsLoading(true);
		setTimeout(() => sendMessage(content), 0);
	};

	const handleStop = () => {
		abortRef.current?.abort();
		abortRef.current = null;
		setIsLoading(false);
		setGenerationStage("idle");
		setStreamingMessageId(null);
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
		if (!userMessage) return;

		const nextAssistant = messages.find(
			(msg, i) => i > messageIndex && msg.sender === "assistant",
		);

		setMessages((prev) =>
			nextAssistant ? prev.filter((msg) => msg.id !== nextAssistant.id) : prev,
		);
		setIsLoading(true);
		sendMessage(userMessage.content, () => {
			toast.success("Mensagem reenviada", { duration: 3000 });
		});
	};

	const handleRegenerate = (id: string) => {
		const messageIndex = messages.findIndex((msg) => msg.id === id);
		if (messageIndex < 0) return;

		let userMessageIndex = messageIndex - 1;
		while (
			userMessageIndex >= 0 &&
			messages[userMessageIndex]?.sender !== "user"
		) {
			userMessageIndex--;
		}
		if (userMessageIndex < 0) return;

		const userMessage = messages[userMessageIndex];
		if (!userMessage) return;

		setMessages((prev) => prev.filter((msg) => msg.id !== id));
		setIsLoading(true);
		sendMessage(userMessage.content, () => {
			toast.success("Resposta regenerada", { duration: 3000 });
		});
	};

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
