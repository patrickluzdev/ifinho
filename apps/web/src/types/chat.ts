export interface MessageData {
	id: string;
	content: string;
	sender: "user" | "assistant";
	metadata?: {
		model?: string;
		responseTime?: number;
		tokens?: number;
	};
}

export type GenerationStage = "idle" | "thinking" | "searching" | "responding";
