export interface ChatRequest {
	message: string;
}

export interface SSEEvent {
	token?: string;
	error?: string;
}
