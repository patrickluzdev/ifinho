"use client";

import { Brain, Globe, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type GenerationStage = "thinking" | "searching" | "responding" | "idle";

interface GenerationStatusProps {
	stage: GenerationStage;
	className?: string;
}

export function GenerationStatus({ stage, className }: GenerationStatusProps) {
	const [dots, setDots] = useState("");

	// Animated dots for the status message
	useEffect(() => {
		if (stage === "idle") return;

		const interval = setInterval(() => {
			setDots((prev) => (prev.length >= 3 ? "" : `${prev}.`));
		}, 500);

		return () => clearInterval(interval);
	}, [stage]);

	if (stage === "idle") return null;

	return (
		<div className={cn("flex justify-start", className)}>
			<div className="flex max-w-[80%] items-center gap-2 rounded-lg bg-muted p-3">
				{stage === "thinking" && (
					<>
						<Brain size={16} className="animate-pulse text-purple-500" />
						<span className="text-muted-foreground text-sm">
							Thinking{dots}
						</span>
					</>
				)}

				{stage === "searching" && (
					<>
						<Globe size={16} className="animate-spin text-blue-500" />
						<span className="text-muted-foreground text-sm">
							Searching{dots}
						</span>
					</>
				)}

				{stage === "responding" && (
					<>
						<MessageSquare
							size={16}
							className="animate-bounce text-green-500"
						/>
						<span className="text-muted-foreground text-sm">
							Responding{dots}
						</span>
					</>
				)}
			</div>
		</div>
	);
}
