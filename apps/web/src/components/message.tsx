"use client";

import { Brain, ChevronDown, PencilIcon, Save, Undo } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Define the pattern handler type
export interface PatternHandler {
	pattern: RegExp;
	render: (match: RegExpExecArray) => React.ReactNode;
}

// Define a generic action button interface
export interface ActionButton {
	id: string;
	icon: React.ReactNode;
	onClick: () => void;
	title?: string;
	className?: string;
}

export interface MessageProps {
	content: string;
	sender: "user" | "assistant";
	actionButtons?: ActionButton[]; // Custom action buttons
	editable?: boolean; // Whether this message can be edited
	onEdit?: (content: string) => void;
	patternHandlers?: PatternHandler[];
	className?: string;
	contentClassName?: string; // Additional className for the content container
}

export function Message({
	content,
	sender,
	actionButtons = [],
	editable = false,
	onEdit,
	patternHandlers = [],
	className,
	contentClassName,
}: MessageProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState(content);
	const [showReasoning, setShowReasoning] = useState(false);

	// Parse think tags: extract reasoning and clean display content in one pass
	// Support "thinking" models by hiding <think>...</think> content in collapsible UI
	const { reasoning, displayContent } = React.useMemo(() => {
		const THINK_TAG_REGEX = /<think>([\s\S]*?)<\/think>/i;
		const match = THINK_TAG_REGEX.exec(content);

		if (!match) {
			return { reasoning: null, displayContent: content };
		}

		return {
			reasoning: match[1].trim(),
			displayContent: content.replace(THINK_TAG_REGEX, "").trim(),
		};
	}, [content]);

	const handleSaveEdit = () => {
		setIsEditing(false);
		if (onEdit && editedContent !== content) onEdit(editedContent);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSaveEdit();
		else if (e.key === "Escape") {
			setIsEditing(false);
			setEditedContent(content);
		}
	};

	const processContent = React.useCallback(
		(text: string): React.ReactNode => {
			if (!text || typeof text !== "string" || patternHandlers.length === 0)
				return text;
			const segments: React.ReactNode[] = [];
			let cursor = 0;
			while (cursor < text.length) {
				let earliest: {
					handler: PatternHandler;
					match: RegExpExecArray;
					index: number;
				} | null = null;
				for (const handler of patternHandlers) {
					handler.pattern.lastIndex = cursor;
					const match = handler.pattern.exec(text);
					if (match && (!earliest || match.index < earliest.index))
						earliest = { handler, match, index: match.index };
				}
				if (!earliest) {
					segments.push(text.slice(cursor));
					break;
				}
				if (earliest.index > cursor)
					segments.push(text.slice(cursor, earliest.index));
				let rendered: React.ReactNode;
				try {
					rendered =
						earliest.handler.render(earliest.match) ?? earliest.match[0];
				} catch {
					rendered = earliest.match[0];
				}
				segments.push(rendered);
				cursor = earliest.index + earliest.match[0].length;
			}
			return <>{segments}</>;
		},
		[patternHandlers],
	);

	const markdownComponents = React.useMemo(() => {
		const processChildren = (children: React.ReactNode) => {
			if (Array.isArray(children)) {
				return children.map((c, index) =>
					typeof c === "string" ? (
						processContent(c)
					) : (
						// biome-ignore lint/suspicious/noArrayIndexKey: ReactMarkdown children have no stable IDs
						<React.Fragment key={index}>{c}</React.Fragment>
					),
				);
			}
			return typeof children === "string" ? processContent(children) : children;
		};

		const base = {
			a: ({
				href,
				children,
			}: {
				href?: string;
				children?: React.ReactNode;
			}) => (
				<a href={href} target="_blank" rel="noopener noreferrer">
					{children}
				</a>
			),
		};

		if (patternHandlers.length === 0) return base;

		return {
			...base,
			p: ({ children }: { children?: React.ReactNode }) => (
				<p>{processChildren(children)}</p>
			),
			li: ({ children }: { children?: React.ReactNode }) => (
				<li>{processChildren(children)}</li>
			),
		};
	}, [patternHandlers, processContent]);

	return (
		<div
			className={cn(
				"group relative flex w-full flex-col",
				sender === "user" ? "items-end" : "items-start",
				className,
			)}
		>
			<div
				className={cn(
					sender === "user"
						? "max-w-[90vw] rounded-lg bg-primary text-primary-foreground sm:max-w-[80%]"
						: "max-w-[90vw] sm:max-w-[70vw]",
					contentClassName,
				)}
			>
				{isEditing ? (
					<div className="p-3">
						<textarea
							className={cn(
								"w-full resize-none rounded-md border p-2 focus:outline-none focus:ring-1 focus:ring-primary",
								sender === "user"
									? "border-primary-foreground/20 bg-primary/90 text-primary-foreground"
									: "border-input bg-muted text-foreground",
							)}
							value={editedContent}
							onChange={(e) => setEditedContent(e.target.value)}
							onKeyDown={handleKeyDown}
							rows={3}
						/>
						<div className="mt-2 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => {
									setIsEditing(false);
									setEditedContent(content);
								}}
								className="text-white transition-colors"
								title="Cancelar"
							>
								<Undo height={18} />
							</button>
							<button
								type="button"
								onClick={handleSaveEdit}
								className="text-white"
								title="Salvar"
							>
								<Save height={18} />
							</button>
						</div>
					</div>
				) : (
					<div className="p-3">
						<div
							className={cn(
								"prose prose-sm max-w-none text-base",
								sender === "user"
									? "prose-invert prose-p:text-primary-foreground"
									: "prose-neutral dark:prose-invert",
							)}
						>
							<ReactMarkdown components={markdownComponents}>
								{displayContent || ""}
							</ReactMarkdown>
							{reasoning && (
								<div className="mt-3 rounded-md border bg-muted/40 text-sm">
									<Collapsible
										open={showReasoning}
										onOpenChange={setShowReasoning}
									>
										<div className="flex cursor-pointer select-none items-center justify-between px-3 py-2">
											<button
												type="button"
												onClick={() => setShowReasoning((o) => !o)}
												className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
											>
												<Brain className="h-4 w-4" />
												<span className="font-medium">
													Raciocínio do modelo
												</span>
												<ChevronDown
													className={cn(
														"h-4 w-4 transition-transform",
														showReasoning ? "rotate-180" : "rotate-0",
													)}
												/>
											</button>
										</div>
										<CollapsibleContent className="px-3 pt-0 pb-3 data-[state=closed]:hidden">
											<div
												className={cn(
													"prose prose-xs wrap-break-word max-w-none whitespace-pre-wrap text-muted-foreground",
													sender === "user" ? "prose-invert" : "",
												)}
											>
												{reasoning}
											</div>
										</CollapsibleContent>
									</Collapsible>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Botões de ação — visíveis no hover, abaixo do balão */}
			{!isEditing && actionButtons.length > 0 && (
				<div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
					{actionButtons.map((button) => (
						<button
							type="button"
							key={button.id}
							onClick={button.onClick}
							className={cn(
								"rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
								button.className,
							)}
							title={button.title}
						>
							{button.icon}
						</button>
					))}
					{editable && onEdit && (
						<button
							type="button"
							onClick={() => setIsEditing(true)}
							className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							title="Editar mensagem"
						>
							<PencilIcon size={16} />
						</button>
					)}
				</div>
			)}
		</div>
	);
}
