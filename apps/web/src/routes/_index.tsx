import { useRef } from "react";
import { ChatFooter } from "@/components/chat-footer";
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
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const isEmpty = chat.messages.length === 0;

	const handleSuggestionClick = (text: string) => {
		chat.handleSend(text);
	};

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
			<main
				className={`mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden${isEmpty ? "justify-center" : ""}`}
			>
				{isEmpty ? (
					<div className="flex flex-col items-center gap-6 px-4 pb-4">
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
						<ChatFooter
							onSendMessage={chat.handleSend}
							onStopGeneration={chat.handleStop}
							isLoading={chat.isLoading}
							inputRef={inputRef}
						/>
					</div>
				) : (
					<>
						<MessageArea
							messages={chat.messages}
							isLoading={chat.isLoading}
							generationStage={chat.generationStage}
							onEditMessage={chat.handleEdit}
							onDeleteMessage={chat.handleDelete}
							onRegenerateMessage={chat.handleRegenerate}
						/>
						<ChatFooter
							onSendMessage={chat.handleSend}
							onStopGeneration={chat.handleStop}
							isLoading={chat.isLoading}
							inputRef={inputRef}
						/>
					</>
				)}
			</main>
		</div>
	);
}
