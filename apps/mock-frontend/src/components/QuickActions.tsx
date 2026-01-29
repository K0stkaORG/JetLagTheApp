import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { Activity, Database, Pause, Play, Server } from "lucide-react";

export function QuickActions() {
	const { apiRequest, addLog } = useAppContext();

	const call = async (path: string) => {
		try {
			const response = await apiRequest({ method: "GET", path });
			addLog("info", `Quick action: ${path}`, response);
		} catch (error) {
			addLog("error", `Quick action failed: ${path}`, error);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Quick Actions</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-2">
				<Button
					variant="outline"
					className="justify-start"
					onClick={() => call("/health")}>
					<Activity className="mr-2 h-4 w-4" />
					Health Check
				</Button>
				<Button
					variant="outline"
					className="justify-start"
					onClick={() => call("/api/debug/seed")}>
					<Database className="mr-2 h-4 w-4" />
					Seed & Restart
				</Button>
				<Button
					variant="outline"
					className="justify-start"
					onClick={() => call("/api/debug/dump-lobby")}>
					<Server className="mr-2 h-4 w-4" />
					Dump Lobby
				</Button>
				<Button
					variant="outline"
					className="justify-start"
					onClick={() => call("/api/debug/dump-servers")}>
					<Server className="mr-2 h-4 w-4" />
					Dump Servers
				</Button>
				<Button
					variant="outline"
					className="justify-start"
					onClick={() => call("/api/debug/pause-all")}>
					<Pause className="mr-2 h-4 w-4" />
					Pause All
				</Button>
				<Button
					variant="outline"
					className="justify-start"
					onClick={() => call("/api/debug/resume-all")}>
					<Play className="mr-2 h-4 w-4" />
					Resume All
				</Button>
			</CardContent>
		</Card>
	);
}
