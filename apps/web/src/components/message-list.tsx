import {
	Copy,
	Info,
	RefreshCw,
	RotateCcw,
	ThumbsDown,
	ThumbsUp,
} from "lucide-react";
import { type RefObject, useState } from "react";
import { toast } from "sonner";
import type { GenerationStage, MessageData } from "@/types/chat";
import { GenerationStatus } from "./generation-status";
import { Message, type PatternHandler } from "./message";

interface MessageListProps {
	messages: MessageData[];
	isLoading: boolean;
	generationStage: GenerationStage;
	patternHandlers?: PatternHandler[];
	onEditMessage: (id: string, content: string) => void;
	onRetryMessage: (id: string) => void;
	onRegenerateMessage: (id: string) => void;
	onFeedback?: (id: string, type: "like" | "dislike") => void;
	lastUserMessageRef?: RefObject<HTMLDivElement | null>;
	streamingMessageId?: string | null;
}

export function MessageList({
	messages,
	isLoading,
	generationStage,
	patternHandlers = [],
	onEditMessage,
	onRetryMessage,
	onRegenerateMessage,
	onFeedback,
	lastUserMessageRef,
	streamingMessageId,
}: MessageListProps) {
	const [metadataVisible, setMetadataVisible] = useState<
		Record<string, boolean>
	>({});
	const [copying, setCopying] = useState<string | null>(null);

	const toggleMetadata = (id: string) => {
		setMetadataVisible((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const handleCopy = (id: string, content: string) => {
		navigator.clipboard.writeText(content);
		setCopying(id);
		toast.success("Copiado para a área de transferência", { duration: 2000 });
		setTimeout(() => setCopying(null), 1000);
	};

	// Index of the last user message in the list
	let lastUserIndex = -1;
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].sender === "user") {
			lastUserIndex = i;
			break;
		}
	}

	return (
		<div className="space-y-8 p-4">
			{messages.map((message, index) => {
				const actionButtons =
					message.sender === "assistant"
						? [
								{
									id: "info",
									icon: <Info size={14} />,
									onClick: () => toggleMetadata(message.id),
									title: "Informações da mensagem",
									className: metadataVisible[message.id] ? "text-blue-500" : "",
								},
								{
									id: "copy",
									icon: (
										<Copy
											size={14}
											className={copying === message.id ? "text-green-500" : ""}
										/>
									),
									onClick: () => handleCopy(message.id, message.content),
									title: "Copiar mensagem",
								},
								{
									id: "regenerate",
									icon: <RefreshCw size={14} />,
									onClick: () => onRegenerateMessage(message.id),
									title: "Regenerar resposta",
								},
								{
									id: "like",
									icon: <ThumbsUp size={14} />,
									onClick: () => onFeedback?.(message.id, "like"),
									title: "Útil",
								},
								{
									id: "dislike",
									icon: <ThumbsDown size={14} />,
									onClick: () => onFeedback?.(message.id, "dislike"),
									title: "Não útil",
								},
							]
						: [
								{
									id: "retry",
									icon: <RotateCcw size={14} />,
									onClick: () => onRetryMessage(message.id),
									title: "Reenviar mensagem",
								},
								{
									id: "copy",
									icon: (
										<Copy
											size={14}
											className={copying === message.id ? "text-green-500" : ""}
										/>
									),
									onClick: () => handleCopy(message.id, message.content),
									title: "Copiar mensagem",
								},
							];

				return (
					<div
						key={message.id}
						ref={index === lastUserIndex ? lastUserMessageRef : undefined}
						className="w-full"
					>
						<Message
							content={message.content}
							sender={message.sender}
							actionButtons={actionButtons}
							editable={message.sender === "user"}
							onEdit={(content) => onEditMessage(message.id, content)}
							patternHandlers={
								message.sender === "assistant" ? patternHandlers : undefined
							}
							isStreaming={message.id === streamingMessageId}
						/>
						{message.sender === "assistant" &&
							message.metadata &&
							metadataVisible[message.id] && (
								<div className="mt-1 max-w-[70%] rounded-md border border-border bg-muted/80 p-3 text-sm shadow-sm">
									<div className="mb-2 flex items-center justify-between">
										<h4 className="font-medium text-sm">Informações</h4>
										<button
											type="button"
											onClick={() => toggleMetadata(message.id)}
											className="text-muted-foreground text-xs hover:text-foreground"
										>
											Fechar
										</button>
									</div>
									<div className="grid grid-cols-2 gap-2">
										{Object.entries(message.metadata).map(([key, value]) => (
											<div key={key} className="contents">
												<div className="text-muted-foreground text-xs capitalize">
													{key.replace(/([A-Z])/g, " $1").trim()}:
												</div>
												<div className="font-medium text-xs">
													{String(value)}
													{key === "responseTime" && "s"}
													{key === "tokens" && " tokens"}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
					</div>
				);
			})}

			{isLoading && <GenerationStatus stage={generationStage} />}
		</div>
	);
}
