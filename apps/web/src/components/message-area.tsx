import { ArrowDown } from "lucide-react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GenerationStage, MessageData } from "@/types/chat";
import type { PatternHandler } from "./message";
import { MessageList } from "./message-list";

interface MessageAreaProps {
	messages: MessageData[];
	isLoading: boolean;
	generationStage: GenerationStage;
	patternHandlers?: PatternHandler[];
	onEditMessage: (id: string, content: string) => void;
	onRetryMessage: (id: string) => void;
	onRegenerateMessage: (id: string) => void;
	onFeedback?: (id: string, type: "like" | "dislike") => void;
	streamingMessageId?: string | null;
}

export function MessageArea({
	messages,
	isLoading,
	generationStage,
	patternHandlers,
	onEditMessage,
	onRetryMessage,
	onRegenerateMessage,
	onFeedback,
	streamingMessageId,
}: MessageAreaProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const lastUserMessageRef = useRef<HTMLDivElement>(null);
	const spacerRef = useRef<HTMLDivElement>(null);
	const [showScrollButton, setShowScrollButton] = useState(false);

	const isViewingOldMessages = useCallback(() => {
		const container = scrollRef.current;
		const lastUserMsg = lastUserMessageRef.current;
		if (!container || !lastUserMsg) return false;
		const containerRect = container.getBoundingClientRect();
		const msgRect = lastUserMsg.getBoundingClientRect();
		return msgRect.bottom < containerRect.top;
	}, []);

	const scrollToLastUserMessage = useCallback(() => {
		const container = scrollRef.current;
		const lastUserMsg = lastUserMessageRef.current;
		if (!container || !lastUserMsg) return;
		const containerRect = container.getBoundingClientRect();
		const msgRect = lastUserMsg.getBoundingClientRect();
		const scrollAmount = msgRect.top - containerRect.top - 16;
		container.scrollBy({ top: scrollAmount, behavior: "smooth" });
	}, []);

	// Before paint: set spacer so user message can scroll to top while waiting.
	// Keep it large while streaming to prevent layout shift that would push
	// the user message away from the top. Collapse only when fully done.
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useLayoutEffect(() => {
		const container = scrollRef.current;
		const lastUserMsg = lastUserMessageRef.current;
		const spacer = spacerRef.current;
		if (!container || !spacer) return;

		const lastMessage = messages[messages.length - 1];
		const keepLarge = lastMessage?.sender === "user" || !!streamingMessageId;

		if (keepLarge && lastUserMsg) {
			const needed = Math.max(
				0,
				container.clientHeight - lastUserMsg.offsetHeight - 16,
			);
			spacer.style.height = `${needed}px`;
		} else {
			// Read user message position BEFORE changing the spacer height so the
			// layout is still in its current (large-spacer) state. This gives the
			// true absolute offset of the message within the scroll content.
			const msgAbsoluteTop = lastUserMsg
				? lastUserMsg.getBoundingClientRect().top -
					container.getBoundingClientRect().top +
					container.scrollTop
				: null;

			if (msgAbsoluteTop !== null) {
				const desiredScrollTop = Math.max(0, msgAbsoluteTop - 16);
				// Compute the minimum spacer to keep desiredScrollTop achievable
				// after collapsing. A short response would shrink scrollHeight below
				// desiredScrollTop + clientHeight, clamping scrollTop upward and
				// revealing older messages above the user's message.
				const contentWithoutSpacer =
					container.scrollHeight - spacer.offsetHeight;
				const neededSpacer = Math.max(
					128,
					desiredScrollTop + container.clientHeight - contentWithoutSpacer,
				);
				spacer.style.height = `${neededSpacer}px`;
				container.scrollTop = desiredScrollTop;
			} else {
				spacer.style.height = "128px";
			}
		}
	}, [messages.length, streamingMessageId]);

	// After paint: scroll ONLY when the user sends (last message is from user)
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useEffect(() => {
		if (messages.length === 0) return;
		const lastMessage = messages[messages.length - 1];
		if (lastMessage.sender !== "user") return;

		requestAnimationFrame(() => {
			const container = scrollRef.current;
			const lastUserMsg = lastUserMessageRef.current;
			if (!container || !lastUserMsg) return;

			const containerRect = container.getBoundingClientRect();
			const msgRect = lastUserMsg.getBoundingClientRect();
			const scrollAmount = msgRect.top - containerRect.top - 16;
			container.scrollBy({ top: scrollAmount, behavior: "smooth" });
		});
	}, [messages.length]);

	const handleScroll = () => {
		setShowScrollButton(isViewingOldMessages());
	};

	return (
		<div className="relative h-full">
			<div
				ref={scrollRef}
				className={cn("h-full overflow-y-auto")}
				onScroll={handleScroll}
			>
				<div className="mx-auto max-w-3xl">
					<MessageList
						messages={messages}
						isLoading={isLoading}
						generationStage={generationStage}
						patternHandlers={patternHandlers}
						onEditMessage={onEditMessage}
						onRetryMessage={onRetryMessage}
						onRegenerateMessage={onRegenerateMessage}
						onFeedback={onFeedback}
						streamingMessageId={streamingMessageId}
						lastUserMessageRef={lastUserMessageRef}
					/>
				</div>
				{/* Dynamic spacer: allows last user message to scroll to the top */}
				<div ref={spacerRef} />
			</div>

			{showScrollButton && (
				<div className="absolute bottom-36 left-1/2 -translate-x-1/2">
					<Button
						size="sm"
						variant="outline"
						className="h-8 w-8 rounded-full p-0 shadow-md"
						onClick={scrollToLastUserMessage}
					>
						<ArrowDown size={14} />
						<span className="sr-only">Ir para o final</span>
					</Button>
				</div>
			)}
		</div>
	);
}
