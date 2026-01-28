import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LogEntry, LogType } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

const typeLabels: Record<LogType, string> = {
	info: "Info",
	error: "Error",
	api: "REST",
	"socket-in": "Socket In",
	"socket-out": "Socket Out",
};

const typeClasses: Record<LogType, string> = {
	info: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
	error: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
	api: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
	"socket-in": "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
	"socket-out": "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
};

function stringify(data: unknown) {
	if (data === undefined) return "";
	if (typeof data === "string") return data;
	try {
		return JSON.stringify(data, null, 2);
	} catch {
		return String(data);
	}
}

export function DebugLog({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) {
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		if (!query.trim()) return logs;
		const lower = query.toLowerCase();
		return logs.filter((log) =>
			[log.message, stringify(log.data), log.type].some((value) =>
				value?.toString().toLowerCase().includes(lower),
			),
		);
	}, [logs, query]);

	return (
		<Card className="h-full flex flex-col">
			<CardHeader className="space-y-2">
				<div className="flex items-center justify-between">
					<CardTitle>Debug Log</CardTitle>
					<Button
						variant="outline"
						size="sm"
						onClick={onClear}>
						Clear
					</Button>
				</div>
				<Input
					placeholder="Filter logs..."
					value={query}
					onChange={(event) => setQuery(event.target.value)}
				/>
			</CardHeader>
			<CardContent className="pt-0 flex-1 min-h-0">
				<ScrollArea className="h-full pr-2">
					<div className="space-y-2">
						{filtered.length === 0 ? (
							<div className="text-sm text-muted-foreground">No logs yet.</div>
						) : (
							filtered.map((log) => (
								<div
									key={log.id}
									className="rounded-md border border-border bg-background/40 p-2 shadow-sm">
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<Badge className={cn("text-[11px] uppercase", typeClasses[log.type])}>
												{typeLabels[log.type]}
											</Badge>
											<span className="text-xs text-muted-foreground">
												{new Date(log.timestamp).toLocaleTimeString()}
											</span>
										</div>
										<span className="text-xs text-muted-foreground">
											{log.type.replace("-", " ")}
										</span>
									</div>
									{log.message && <div className="mt-1 text-sm font-medium">{log.message}</div>}
									{log.data !== undefined && (
										<pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-1.5 text-[11px] text-muted-foreground">
											{stringify(log.data)}
										</pre>
									)}
								</div>
							))
						)}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
