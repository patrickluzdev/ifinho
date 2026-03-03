export interface SlashCommand {
	command: string;
	description: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
	{ command: "/ajuda", description: "Mostra o que o assistente pode fazer" },
	{ command: "/sobre", description: "Informações sobre o Ifinho" },
];
