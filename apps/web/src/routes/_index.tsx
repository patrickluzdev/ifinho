import { useEffect, useMemo, useRef } from "react";
import { SLASH_COMMANDS } from "@/commands";
import { ChatFooter } from "@/components/chat-footer";
import type { ChatInputHandle } from "@/components/chat-input";
import type { PatternHandler } from "@/components/message";
import { MessageArea } from "@/components/message-area";
import { useChat } from "@/hooks/use-chat";

const SUGGESTIONS = [
	"Quando fecha o prazo de inscrição do PIBIC?",
	"Como solicitar o histórico escolar?",
	"Qual é o calendário acadêmico de 2026?",
	"Quais são os cursos disponíveis no campus Canoas?",
];

export default function Home() {
	const chat = useChat();
	const inputRef = useRef<ChatInputHandle>(null);
	const isEmpty = chat.messages.length === 0;

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		if (!chat.isLoading) inputRef.current?.focus();
	}, [chat.isLoading]);

	const handleSuggestionClick = (text: string) => {
		chat.handleSend(text);
	};

	const patternHandlers = useMemo<PatternHandler[]>(
		() => [
			{
				pattern: new RegExp(
					`\\/(${SLASH_COMMANDS.map((c) => c.command.slice(1)).join("|")})(?!\\w)`,
					"g",
				),
				render: (match) => (
					<button
						type="button"
						onClick={() => chat.handleSend(match[0])}
						className="inline cursor-pointer rounded bg-[#03316f]/10 px-1 py-0.5 font-mono text-[#03316f] text-sm transition-colors hover:bg-[#03316f]/20 dark:bg-[#03316f]/30 dark:text-[#6ea8d8] dark:hover:bg-[#03316f]/40"
					>
						{match[0]}
					</button>
				),
			},
		],
		[chat.handleSend],
	);

	if (isEmpty) {
		return (
			<div className="h-screen overflow-hidden bg-background text-foreground">
				<main className="mx-auto flex h-full w-full max-w-3xl flex-col justify-center">
					<div className="flex w-full flex-col gap-6 pb-4">
						<div className="flex flex-col items-center gap-4 px-4">
							<div className="text-center">
								<h2 className="font-semibold text-xl">Olá! Sou o Ifinho</h2>
								<p className="mt-1 text-muted-foreground text-sm">
									Assistente do IFRS Campus Canoas
								</p>
							</div>
							<div className="grid w-full max-w-md gap-2">
								{SUGGESTIONS.map((suggestion) => (
									<button
										key={suggestion}
										type="button"
										onClick={() => handleSuggestionClick(suggestion)}
										className="rounded-lg border bg-muted/40 px-4 py-3 text-left text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
									>
										{suggestion}
									</button>
								))}
							</div>
						</div>
						<ChatFooter
							onSendMessage={chat.handleSend}
							onStopGeneration={chat.handleStop}
							isLoading={chat.isLoading}
							inputRef={inputRef}
						/>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="relative h-screen overflow-hidden bg-background text-foreground">
			<MessageArea
				messages={chat.messages}
				isLoading={chat.isLoading}
				generationStage={chat.generationStage}
				streamingMessageId={chat.streamingMessageId}
				patternHandlers={patternHandlers}
				onEditMessage={chat.handleEdit}
				onRetryMessage={chat.handleRetry}
				onRegenerateMessage={chat.handleRegenerate}
			/>
			<div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-60% from-background to-transparent">
				<div className="mx-auto w-full max-w-3xl">
					<ChatFooter
						onSendMessage={chat.handleSend}
						onStopGeneration={chat.handleStop}
						isLoading={chat.isLoading}
						inputRef={inputRef}
					/>
				</div>
			</div>
		</div>
	);
}
