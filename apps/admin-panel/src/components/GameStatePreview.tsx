import { Eye, EyeOff } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

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

	const hideAll = useCallback(() => {
		setHiddenKeys(new Set(allKeys));
	}, [allKeys]);

	const showAll = useCallback(() => {
		setHiddenKeys(new Set());
	}, []);

	if (!isObject) {
		return (
			<pre className={`text-foreground font-mono text-xs leading-relaxed whitespace-pre-wrap ${className}`}>
				{JSON.stringify(state, null, 2)}
			</pre>
		);
	}

	if (entries.length === 0) {
		return <pre className={`text-foreground font-mono text-xs leading-relaxed ${className}`}>&#123;&#125;</pre>;
	}

	const allHidden = hiddenKeys.size === entries.length;
	const noneHidden = hiddenKeys.size === 0;

	return (
		<div className={`space-y-3 font-mono text-xs ${className}`}>
			<div className="flex items-center justify-between border-b border-border/40 pb-2">
				<span className="text-[11px] font-medium text-muted-foreground">
					{hiddenKeys.size} of {entries.length} properties hidden
				</span>
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={hideAll}
						disabled={allHidden}
						className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
						title="Hide all top-level properties">
						<EyeOff className="size-3 text-destructive" />
						Hide All
					</button>
					<button
						type="button"
						onClick={showAll}
						disabled={noneHidden}
						className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
						title="Show all top-level properties">
						<Eye className="size-3 text-primary" />
						Show All
					</button>
				</div>
			</div>

			<div className="text-foreground font-mono leading-relaxed whitespace-pre">
				<span>&#123;</span>
				{entries.map(([key, val], index) => {
					const isHidden = hiddenKeys.has(key);
					const isLast = index === entries.length - 1;
					const comma = isLast ? "" : ",";
					const formattedVal = !isHidden ? formatSubtreeValue(val) : "";

					return (
						<div
							key={key}
							className="group my-0.5 flex flex-wrap items-start gap-x-1.5 py-0.5 pl-4 transition-colors hover:bg-muted/20 rounded">
							<span className="shrink-0 font-semibold text-[#83a598]">{key}</span>
							<span className="shrink-0 text-[#928374]">:</span>

							{isHidden ? (
								<button
									type="button"
									onClick={() => toggleKey(key)}
									className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border/40 bg-muted/40 px-1.5 py-0.5 text-muted-foreground select-none transition-colors hover:bg-muted hover:text-foreground"
									title={`Click to reveal ${key}`}>
									<EyeOff className="size-3.5 text-destructive" />
								</button>
							) : (
								<div className="inline-flex min-w-0 max-w-full items-start gap-2">
									<pre className="text-foreground min-w-0 font-mono leading-relaxed whitespace-pre-wrap break-all">
										{formattedVal}
									</pre>
									<button
										type="button"
										onClick={() => toggleKey(key)}
										className="inline-flex cursor-pointer items-center rounded p-0.5 text-muted-foreground/60 select-none transition-colors hover:bg-muted hover:text-destructive"
										title={`Click to hide ${key}`}>
										<Eye className="size-3.5 text-primary" />
									</button>
								</div>
							)}
							<span className="text-[#928374]">{comma}</span>
						</div>
					);
				})}
				<span>&#125;</span>
			</div>
		</div>
	);
}
