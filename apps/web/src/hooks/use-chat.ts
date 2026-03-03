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
			setMessages((prev) => [
				...prev,
				{ id: msgId, content: "", sender: "assistant" },
			]);
			setGenerationStage("thinking");
			setStreamingMessageId(msgId);

			abortRef.current = new AbortController();

			try {
				let started = false;
				for await (const token of streamSSE(
					`${SERVER_URL}/api/chat`,
					{ message: content },
					abortRef.current.signal,
				)) {
					if (!started) {
						setGenerationStage("idle");
						started = true;
					}
					setMessages((prev) =>
						prev.map((msg) =>
							msg.id === msgId ? { ...msg, content: msg.content + token } : msg,
						),
					);
				}
			} catch (err) {
				if ((err as Error).name === "AbortError") return;
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === msgId
							? {
									...msg,
									content: "Erro ao conectar com o servidor. Tente novamente.",
								}
							: msg,
					),
				);
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
		// Defer to next task so React renders the user message first,
		// allowing the scroll-to-user-message effect to fire before the
		// assistant message is added to state.
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
