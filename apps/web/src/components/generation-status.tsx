"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { GenerationStage } from "@/types/chat";

interface GenerationStatusProps {
	stage: GenerationStage;
	className?: string;
}

const stageText: Record<Exclude<GenerationStage, "idle">, string> = {
	thinking: "Pensando",
	searching: "Buscando documentos",
	responding: "Respondendo",
};

export function GenerationStatus({ stage, className }: GenerationStatusProps) {
	const [dots, setDots] = useState("");

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
			<div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
				<span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/60" />
				<span className="text-muted-foreground text-sm">
					{stageText[stage]}
					{dots}
				</span>
			</div>
		</div>
	);
}
