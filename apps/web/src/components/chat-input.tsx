"use client";

import { Send, Square } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChatInputHandle {
	clear: () => void;
	focus: () => void;
}

export interface ChatInputProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	onSend: (message: string) => void;
	onStopGeneration?: () => void;
	isLoading?: boolean;
	placeholder?: string;
	onValueChange?: (value: string) => void;
}

export const ChatInput = React.forwardRef<ChatInputHandle, ChatInputProps>(
	(
		{
			className,
			onSend,
			onStopGeneration,
			isLoading = false,
			placeholder = "Pergunte sobre o IFRS Canoas...",
			onValueChange,
			onKeyDown,
			...props
		},
		ref,
	) => {
		const [input, setInput] = React.useState("");
		const textareaRef = React.useRef<HTMLTextAreaElement>(null);

		React.useImperativeHandle(
			ref,
			() => ({
				clear: () => setInput(""),
				focus: () => textareaRef.current?.focus(),
			}),
			[],
		);

		const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setInput(e.target.value);
			onValueChange?.(e.target.value);
		};

		const handleSend = React.useCallback(
			(e: React.SyntheticEvent) => {
				e.preventDefault();
				if (!input.trim() || isLoading) return;
				onSend(input.trim());
				setInput("");
				onValueChange?.("");
				textareaRef.current?.blur();
			},
			[input, isLoading, onSend, onValueChange],
		);

		const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			onKeyDown?.(e);
			if (e.defaultPrevented) return;
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend(e);
			}
		};

		// biome-ignore lint/correctness/useExhaustiveDependencies: input is the intended trigger for auto-resize
		React.useEffect(() => {
			const textarea = textareaRef.current;
			if (!textarea) return;
			const scrollTop = textarea.scrollTop;
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
			textarea.scrollTop = scrollTop;
		}, [input]);

		return (
			<div className={cn("relative mx-auto w-full max-w-200", className)}>
				<form onSubmit={handleSend} className="relative">
					<div className="relative overflow-hidden rounded-lg border bg-background shadow-sm">
						<textarea
							ref={textareaRef}
							placeholder={placeholder}
							className="min-h-21 w-full resize-none border-none px-4 pt-3 pb-12 placeholder:text-muted-foreground focus:outline-none focus-visible:ring-0"
							value={input}
							onChange={handleChange}
							onKeyDown={handleKeyDown}
							rows={1}
							disabled={isLoading}
							{...props}
						/>

						<div className="absolute right-0 bottom-0 left-0 flex items-center justify-end px-2 py-2">
							{isLoading ? (
								<Button
									type="button"
									onClick={onStopGeneration}
									size="sm"
									variant="ghost"
									className="h-7 w-7 shrink-0 rounded-full p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
								>
									<Square size={14} className="fill-destructive" />
									<span className="sr-only">Parar geração</span>
								</Button>
							) : (
								<Button
									type="submit"
									size="sm"
									variant="ghost"
									disabled={!input.trim()}
									className={cn(
										"h-7 w-7 shrink-0 rounded-full p-0",
										input.trim()
											? "text-primary hover:text-primary"
											: "text-muted-foreground",
									)}
								>
									<Send size={14} />
									<span className="sr-only">Enviar</span>
								</Button>
							)}
						</div>
					</div>
				</form>
			</div>
		);
	},
);

ChatInput.displayName = "ChatInput";
