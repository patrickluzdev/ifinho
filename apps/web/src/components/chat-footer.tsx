import type React from "react";
import { ChatInput } from "@/components/chat-input";

interface ChatFooterProps {
	onSendMessage: (content: string) => void;
	onStopGeneration: () => void;
	isLoading: boolean;
	inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatFooter({
	onSendMessage,
	onStopGeneration,
	isLoading,
	inputRef,
}: ChatFooterProps) {
	return (
		<div className="shrink-0 p-4">
			<ChatInput
				ref={inputRef}
				onSend={onSendMessage}
				onStopGeneration={onStopGeneration}
				isLoading={isLoading}
			/>
		</div>
	);
}
