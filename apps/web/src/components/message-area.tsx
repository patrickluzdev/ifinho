import { ArrowDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GenerationStage, MessageData } from "@/types/chat";
import type { PatternHandler } from "./message";
import { MessageList } from "./message-list";

interface MessageAreaProps {
	messages: MessageData[];
	isLoading: boolean;
	generationStage: GenerationStage;
	patternHandlers?: PatternHandler[];
	onEditMessage: (id: string, content: string) => void;
	onDeleteMessage: (id: string) => void;
	onRegenerateMessage: (id: string) => void;
	onFeedback?: (id: string, type: "like" | "dislike") => void;
}

export function MessageArea({
	messages,
	isLoading,
	generationStage,
	patternHandlers,
	onEditMessage,
	onDeleteMessage,
	onRegenerateMessage,
	onFeedback,
}: MessageAreaProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const [showScrollButton, setShowScrollButton] = useState(false);

	const isNearBottom = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return true;
		return el.scrollHeight - el.scrollTop - el.clientHeight <= 100;
	}, []);

	const scrollToBottom = useCallback(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	// Auto-scroll quando chegam novas mensagens, só se perto do final
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — scroll on message count or loading change
	useEffect(() => {
		if (isNearBottom()) scrollToBottom();
	}, [messages.length, isLoading]);

	const handleScroll = () => {
		setShowScrollButton(!isNearBottom());
	};

	return (
		<div className="relative flex-1 overflow-hidden">
			<div
				ref={scrollRef}
				className="h-full overflow-y-auto"
				onScroll={handleScroll}
			>
				<MessageList
					messages={messages}
					isLoading={isLoading}
					generationStage={generationStage}
					patternHandlers={patternHandlers}
					onEditMessage={onEditMessage}
					onDeleteMessage={onDeleteMessage}
					onRegenerateMessage={onRegenerateMessage}
					onFeedback={onFeedback}
				/>
				<div ref={bottomRef} />
			</div>

			{showScrollButton && (
				<div className="absolute right-4 bottom-4">
					<Button
						size="sm"
						variant="outline"
						className="h-8 w-8 rounded-full p-0 shadow-md"
						onClick={scrollToBottom}
					>
						<ArrowDown size={14} />
						<span className="sr-only">Ir para o final</span>
					</Button>
				</div>
			)}
		</div>
	);
}
