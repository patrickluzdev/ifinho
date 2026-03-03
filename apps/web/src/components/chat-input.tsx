"use client";

import { ChevronDown, PlusCircle, Send, Square } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

export interface ChatInputProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	onSend: (message: string) => void;
	onStopGeneration?: () => void;
	isLoading?: boolean;
	placeholder?: string;
	tools?: {
		icon: React.ReactNode;
		label: string;
		id: string;
		type?: "toggle" | "dropdown";
		options?: { value: string; label: string }[];
		value?: string;
		onChange?: (value: string) => void;
	}[];
}

export const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
	(
		{
			className,
			onSend,
			onStopGeneration,
			isLoading = false,
			placeholder = "Message...",
			tools = [],
			...props
		},
		ref,
	) => {
		const [input, setInput] = React.useState("");
		const [activeTools, setActiveTools] = React.useState<string[]>([]);
		const textareaRef = React.useRef<HTMLTextAreaElement>(null);
		const toolbarRef = React.useRef<HTMLDivElement>(null);

		// Handle merged refs
		const mergedRef = React.useMemo(
			() => (node: HTMLTextAreaElement | null) => {
				if (node) {
					if (typeof ref === "function") ref(node);
					else if (ref) ref.current = node;
					textareaRef.current = node;
				}
			},
			[ref],
		);

		// Handle sending message
		const handleSendMessage = React.useCallback(
			(e: React.FormEvent) => {
				e.preventDefault();
				if (!input.trim() || isLoading) return;
				onSend(input.trim());
				setInput("");
			},
			[input, isLoading, onSend],
		);

		// Toggle tool selection
		const toggleTool = React.useCallback((id: string) => {
			setActiveTools((prev) =>
				prev.includes(id) ? prev.filter((tool) => tool !== id) : [...prev, id],
			);
		}, []);

		// Adjust textarea padding based on toolbar height
		React.useEffect(() => {
			const adjustPadding = () => {
				if (textareaRef.current && toolbarRef.current) {
					textareaRef.current.style.paddingBottom = `${
						toolbarRef.current.offsetHeight + 8
					}px`;
				}
			};

			adjustPadding();

			// Observe toolbar size changes
			const resizeObserver = new ResizeObserver(adjustPadding);
			if (toolbarRef.current) resizeObserver.observe(toolbarRef.current);

			return () => resizeObserver.disconnect();
		}, []);

		// Auto-resize textarea
		React.useEffect(() => {
			if (!textareaRef.current) return;

			const scrollTop = textareaRef.current.scrollTop;
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${Math.min(
				textareaRef.current.scrollHeight,
				200,
			)}px`;
			textareaRef.current.scrollTop = scrollTop;
		}, []);

		return (
			<div className={cn("relative mx-auto w-full max-w-200", className)}>
				<form onSubmit={handleSendMessage} className="relative">
					<div className="relative overflow-hidden rounded-lg border bg-background shadow-sm">
						<textarea
							ref={mergedRef}
							placeholder={placeholder}
							className="!pb-0 mb-12 w-full resize-none border-none px-4 pt-3 placeholder:text-muted-foreground focus:outline-none focus-visible:ring-0"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleSendMessage(e);
								}
							}}
							rows={1}
							disabled={isLoading}
							{...props}
						/>

						<div
							ref={toolbarRef}
							className="absolute right-0 bottom-0 left-0 flex items-center border-t border-none px-2 py-1 pb-2"
						>
							<div className="flex flex-wrap gap-1">
								<Button
									type="button"
									size="sm"
									variant="ghost"
									className="h-7 w-7 flex-shrink-0 rounded-full p-0 text-muted-foreground hover:text-foreground"
								>
									<PlusCircle size={14} />
									<span className="sr-only">Add attachment</span>
								</Button>

								{tools.map((tool) => (
									<React.Fragment key={tool.id}>
										{tool.type === "dropdown" ? (
											<DropdownMenu>
												<DropdownMenuTrigger disabled={isLoading}>
													<Button
														variant="ghost"
														size="sm"
														className="h-7 gap-1 px-2 font-normal text-xs"
													>
														{tool.icon}
														<span className="hidden sm:inline">
															{tool.options?.find(
																(opt) => opt.value === tool.value,
															)?.label || tool.label}
														</span>
														<ChevronDown size={12} className="opacity-50" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="start">
													{tool.options?.map((option) => (
														<DropdownMenuItem
															key={option.value}
															className={cn(
																"cursor-pointer text-xs",
																tool.value === option.value &&
																	"bg-muted font-medium",
															)}
															onClick={() => {
																tool.onChange?.(option.value);
															}}
														>
															{option.label}
														</DropdownMenuItem>
													))}
												</DropdownMenuContent>
											</DropdownMenu>
										) : (
											<Toggle
												pressed={activeTools.includes(tool.id)}
												onPressedChange={() => toggleTool(tool.id)}
												size="sm"
												variant="outline"
												className={cn(
													"me-2 flex h-7 items-center gap-1 rounded-md px-2 text-xs",
													activeTools.includes(tool.id)
														? "bg-muted text-foreground"
														: "text-muted-foreground",
												)}
												disabled={isLoading}
											>
												{tool.icon}
												<span className="hidden sm:inline">{tool.label}</span>
											</Toggle>
										)}
									</React.Fragment>
								))}
							</div>

							<div className="ml-auto">
								{isLoading ? (
									<Button
										type="button"
										onClick={onStopGeneration}
										size="sm"
										variant="ghost"
										className="h-7 w-7 flex-shrink-0 rounded-full p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
									>
										<Square size={14} className="fill-destructive" />
										<span className="sr-only">Stop generation</span>
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
										<span className="sr-only">Send message</span>
									</Button>
								)}
							</div>
						</div>
					</div>
				</form>
			</div>
		);
	},
);

ChatInput.displayName = "ChatInput";
