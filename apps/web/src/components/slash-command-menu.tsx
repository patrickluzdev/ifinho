import { SLASH_COMMANDS } from "@/commands";
import { cn } from "@/lib/utils";

interface SlashCommandMenuProps {
	query: string;
	activeIndex: number;
	onSelect: (command: string) => void;
}

export function SlashCommandMenu({
	query,
	activeIndex,
	onSelect,
}: SlashCommandMenuProps) {
	const filtered = SLASH_COMMANDS.filter((c) =>
		c.command.slice(1).startsWith(query.toLowerCase()),
	);

	if (filtered.length === 0) return null;

	return (
		<div className="absolute right-0 bottom-full left-0 mb-2 overflow-hidden rounded-lg border bg-background shadow-md">
			{filtered.map((cmd, i) => (
				<button
					key={cmd.command}
					type="button"
					onClick={() => onSelect(cmd.command)}
					className={cn(
						"flex w-full items-baseline gap-3 px-4 py-2.5 text-left transition-colors",
						i === activeIndex ? "bg-muted" : "hover:bg-muted/60",
					)}
				>
					<span className="font-medium text-foreground text-sm">
						{cmd.command}
					</span>
					<span className="text-muted-foreground text-xs">
						{cmd.description}
					</span>
				</button>
			))}
		</div>
	);
}
