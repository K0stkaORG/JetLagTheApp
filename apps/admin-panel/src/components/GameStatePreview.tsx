import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "./ui/button";

interface GameStatePreviewProps {
	state: unknown;
	className?: string;
}

function formatSubtreeValue(val: unknown): string {
	if (val === undefined) return "undefined";
	if (val === null) return "null";
	if (typeof val === "string") return JSON.stringify(val);
	if (typeof val === "number" || typeof val === "boolean") return String(val);
	return JSON.stringify(val, null, 2);
}

export function GameStatePreview({ state, className = "" }: GameStatePreviewProps) {
	const isObject = state !== null && typeof state === "object" && !Array.isArray(state);

	const entries = useMemo(() => {
		if (!isObject) return [];
		return Object.entries(state as Record<string, unknown>);
	}, [isObject, state]);

	const allKeys = useMemo(() => entries.map(([k]) => k), [entries]);

	// Top-level properties start hidden by default
	const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set(allKeys));

	const toggleKey = useCallback((key: string) => {
		setHiddenKeys((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	}, []);

	if (!isObject)
		return (
			<pre className={cn(`text-foreground font-mono text-xs leading-relaxed whitespace-pre-wrap`, className)}>
				{JSON.stringify(state, null, 2)}
			</pre>
		);

	if (entries.length === 0) {
		return <pre className={cn(`text-foreground font-mono text-xs leading-relaxed`, className)}>&#123;&#125;</pre>;
	}

	return (
		<div className={cn("text-foreground font-mono text-xs leading-relaxed whitespace-pre", className)}>
			<span>&#123;</span>
			{entries.map(([key, val], index) => {
				const isHidden = hiddenKeys.has(key);
				const isLast = index === entries.length - 1;
				const comma = isLast ? "" : ",";
				const formattedVal = !isHidden ? formatSubtreeValue(val) : "";

				return (
					<div
						key={key}
						className="pl-4">
						<Button
							onClick={() => toggleKey(key)}
							variant="outline"
							size="icon-xs"
							className="relative top-0.5 mr-1.5 h-auto rounded-[4px] py-0.5">
							{isHidden ? (
								<EyeOff className="text-destructive size-3.5" />
							) : (
								<Eye className="text-primary size-3.5" />
							)}
						</Button>

						<span className="shrink-0 font-semibold text-[#83a598]">{key}</span>
						<span className="mr-1.5 shrink-0 text-[#928374]">:</span>

						{isHidden ? (
							<span className="bg-linear-to-r from-[#928374] to-transparent bg-clip-text text-transparent">
								●●●●●●●●●●
							</span>
						) : (
							<pre
								className={cn("text-foreground min-w-0 font-mono leading-relaxed whitespace-pre-wrap")}>
								{formattedVal}
							</pre>
						)}
						<span className="mt-auto text-[#928374]">{comma}</span>
					</div>
				);
			})}
			<span>&#125;</span>
		</div>
	);
}
