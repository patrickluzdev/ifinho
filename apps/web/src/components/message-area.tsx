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
	isInputFocused: boolean;
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
	isInputFocused,
}: MessageAreaProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const lastUserMessageRef = useRef<HTMLDivElement>(null);
	const spacerRef = useRef<HTMLDivElement>(null);
	const userScrolledUpRef = useRef(false);
	const [showScrollButton, setShowScrollButton] = useState(false);

	const scrollToBottom = useCallback(() => {
		const container = scrollRef.current;
		const spacer = spacerRef.current;
		if (!container || !spacer) return;
		const contentHeight = container.scrollHeight - spacer.offsetHeight;
		const target = Math.max(0, contentHeight - container.clientHeight + 16);
		container.scrollTo({ top: target, behavior: "smooth" });
		userScrolledUpRef.current = false;
	}, []);

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
			const currentScrollTop = container.scrollTop;
			const contentWithoutSpacer = container.scrollHeight - spacer.offsetHeight;
			const neededSpacer =
				currentScrollTop > 0
					? Math.max(
							0,
							currentScrollTop + container.clientHeight - contentWithoutSpacer,
						)
					: 0;
			spacer.style.height = `${neededSpacer}px`;
		}
	}, [messages.length, streamingMessageId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useEffect(() => {
		if (messages.length === 0) return;
		const lastMessage = messages[messages.length - 1];
		if (lastMessage.sender !== "user") return;

		userScrolledUpRef.current = false;

		requestAnimationFrame(() => {
			const container = scrollRef.current;
			const lastUserMsg = lastUserMessageRef.current;
			if (!container || !lastUserMsg) return;
			const containerRect = container.getBoundingClientRect();
			const msgRect = lastUserMsg.getBoundingClientRect();
			container.scrollBy({
				top: msgRect.top - containerRect.top - 16,
				behavior: "smooth",
			});
		});
	}, [messages.length]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers on every token
	useEffect(() => {
		if (!streamingMessageId || userScrolledUpRef.current) return;
		const container = scrollRef.current;
		const spacer = spacerRef.current;
		const lastUserMsg = lastUserMessageRef.current;
		if (!container || !spacer) return;

		const contentHeight = container.scrollHeight - spacer.offsetHeight;
		const terminalScroll = Math.max(
			0,
			contentHeight - container.clientHeight + 16,
		);

		const userMsgFloor = lastUserMsg
			? Math.max(
					0,
					lastUserMsg.getBoundingClientRect().top -
						container.getBoundingClientRect().top +
						container.scrollTop -
						16,
				)
			: 0;

		container.scrollTop = Math.max(userMsgFloor, terminalScroll);
	}, [messages, streamingMessageId]);

	const handleScroll = () => {
		const container = scrollRef.current;
		const spacer = spacerRef.current;
		const lastUserMsg = lastUserMessageRef.current;
		if (streamingMessageId && container && spacer && spacer.offsetHeight > 0) {
			const contentHeight = container.scrollHeight - spacer.offsetHeight;
			const terminalScroll = Math.max(
				0,
				contentHeight - container.clientHeight + 16,
			);

			const userMsgFloor = lastUserMsg
				? Math.max(
						0,
						lastUserMsg.getBoundingClientRect().top -
							container.getBoundingClientRect().top +
							container.scrollTop -
							16,
					)
				: 0;

			const effectiveCeil = Math.max(terminalScroll, userMsgFloor);

			userScrolledUpRef.current = container.scrollTop < effectiveCeil - 10;

			if (container.scrollTop > effectiveCeil) {
				container.scrollTop = effectiveCeil;
			}

			setShowScrollButton(userScrolledUpRef.current);
			return;
		}

		if (!container || !spacer) return;
		const contentHeight = container.scrollHeight - spacer.offsetHeight;
		const contentBottom = Math.max(
			0,
			contentHeight - container.clientHeight + 16,
		);
		setShowScrollButton(container.scrollTop < contentBottom - 50);
	};

	return (
		<div className="relative h-full">
			<div
				ref={scrollRef}
				className={cn("h-full overflow-y-auto")}
				onScroll={handleScroll}
			>
				<div className="mx-auto max-w-3xl pb-40">
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
