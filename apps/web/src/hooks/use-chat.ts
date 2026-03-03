import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { GenerationStage, MessageData } from "@/types/chat";

export function useChat() {
	const [messages, setMessages] = useState<MessageData[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [generationStage, setGenerationStage] =
		useState<GenerationStage>("idle");
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleSend = (content: string) => {
		const userMessage: MessageData = {
			id: Date.now().toString(),
			content,
			sender: "user",
		};
		setMessages((prev) => [...prev, userMessage]);
		setIsLoading(true);
		setGenerationStage("thinking");

		// Placeholder — será substituído pela chamada real ao backend
		timeoutRef.current = setTimeout(() => {
			setGenerationStage("searching");
			timeoutRef.current = setTimeout(() => {
				setGenerationStage("responding");
				timeoutRef.current = setTimeout(() => {
					const assistantMessage: MessageData = {
						id: (Date.now() + 1).toString(),
						content: `Recebi sua pergunta: "${content}"\n\nEm breve estarei conectado ao backend do IFRS Canoas para responder com base nos documentos institucionais.`,
						sender: "assistant",
					};
					setMessages((prev) => [...prev, assistantMessage]);
					setIsLoading(false);
					setGenerationStage("idle");
					timeoutRef.current = null;
				}, 1500);
			}, 1500);
		}, 1500);
	};

	const handleStop = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					content: "Geração interrompida.",
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

	const handleDelete = (id: string) => {
		setMessages((prev) => prev.filter((msg) => msg.id !== id));
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
					setMessages((prev) => [
						...prev,
						{
							id: Date.now().toString(),
							content: `[Regenerado] Recebi sua pergunta: "${userMessage.content}"`,
							sender: "assistant",
						},
					]);
					setIsLoading(false);
					setGenerationStage("idle");
					timeoutRef.current = null;
					toast.success("Resposta regenerada", { duration: 3000 });
				}, 1500);
			}, 1500);
		}, 1500);
	};

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	return {
		messages,
		isLoading,
		generationStage,
		handleSend,
		handleStop,
		handleEdit,
		handleDelete,
		handleRegenerate,
	};
}
