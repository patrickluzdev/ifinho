import * as React from "react";
import { SLASH_COMMANDS } from "@/commands";
import { ChatInput, type ChatInputHandle } from "@/components/chat-input";
import { SlashCommandMenu } from "@/components/slash-command-menu";

interface ChatFooterProps {
	onSendMessage: (content: string) => void;
	onStopGeneration: () => void;
	isLoading: boolean;
	inputRef?: React.RefObject<ChatInputHandle | null>;
}

export function ChatFooter({
	onSendMessage,
	onStopGeneration,
	isLoading,
	inputRef,
}: ChatFooterProps) {
	const [inputValue, setInputValue] = React.useState("");
	const [activeIndex, setActiveIndex] = React.useState(0);

	const query = inputValue.startsWith("/")
		? inputValue.slice(1).toLowerCase()
		: "";
	const filtered = SLASH_COMMANDS.filter((c) =>
		c.command.slice(1).startsWith(query),
	);
	const showMenu =
		inputValue.startsWith("/") && !isLoading && filtered.length > 0;

	// Reset activeIndex when menu opens/closes or query changes
	React.useEffect(() => {
		setActiveIndex(0);
	}, [query]);

	const handleCommandSelect = React.useCallback(
		(command: string) => {
			onSendMessage(command);
			setInputValue("");
			inputRef?.current?.clear();
		},
		[onSendMessage, inputRef],
	);

	const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (!showMenu) return;
		if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(0, i - 1));
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (filtered[activeIndex]) {
				handleCommandSelect(filtered[activeIndex].command);
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			setInputValue("");
			inputRef?.current?.clear();
		}
	};

	return (
		<div className="shrink-0 p-4">
			<div className="relative mx-auto w-full max-w-200">
				{showMenu && (
					<SlashCommandMenu
						query={query}
						activeIndex={activeIndex}
						onSelect={handleCommandSelect}
					/>
				)}
				<ChatInput
					ref={inputRef}
					onSend={onSendMessage}
					onStopGeneration={onStopGeneration}
					isLoading={isLoading}
					onValueChange={setInputValue}
					onKeyDown={handleMenuKeyDown}
					className="mx-0 max-w-none"
				/>
			</div>
		</div>
	);
}
