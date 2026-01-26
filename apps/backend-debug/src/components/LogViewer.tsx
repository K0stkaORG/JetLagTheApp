import { useAppContext } from "@/context/AppContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function LogViewer() {
	const { logs, clearLogs } = useAppContext();

	return (
		<Card className="flex flex-col h-full border-l rounded-none">
			<CardHeader className="flex flex-row items-center justify-between py-4">
				<CardTitle className="text-lg">Logs</CardTitle>
				<Button
					variant="ghost"
					size="icon"
					onClick={clearLogs}
					title="Clear Logs">
					<Trash2 className="h-4 w-4" />
				</Button>
			</CardHeader>
			<CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="p-4 space-y-3">
						{logs.length === 0 && (
							<div className="text-muted-foreground text-center text-sm">No logs yet...</div>
						)}
						{logs.map((log) => (
							<div
								key={log.id}
								className="border-b border-border/50 pb-2 last:border-0">
								<div className="text-xs text-muted-foreground mb-1 flex justify-between">
									<span
										className={
											log.type === "error"
												? "text-destructive font-bold"
												: log.type === "socket-in"
													? "text-green-500 font-bold"
													: log.type === "socket-out"
														? "text-blue-500 font-bold"
														: log.type === "api"
															? "text-orange-500 font-bold"
															: "text-foreground font-bold"
										}>
										{log.type.toUpperCase()}
									</span>
									<span>{log.timestamp}</span>
								</div>
								<div className="text-sm break-all font-mono">
									{typeof log.data === "string" ? (
										log.data
									) : (
										<pre className="whitespace-pre-wrap bg-muted/50 p-2 rounded text-xs overflow-x-auto">
											{JSON.stringify(log.data, null, 2)}
										</pre>
									)}
								</div>
							</div>
						))}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
