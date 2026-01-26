import { useState } from "react";
import axios from "axios";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, HeartPulse, List, LogIn } from "lucide-react";

export function QuickActionsScreen() {
	const { addLog, isConnected, socket, token } = useAppContext();

	// Helper for socket emit if connected
	const emit = (event: string, data: any) => {
		if (!socket || !isConnected) {
			addLog("error", "Socket not connected");
			return;
		}
		socket.emit(event, data);
		addLog("socket-out", { event, data });
	};

	// Helper for API call
	const callApi = async (method: "GET" | "POST", url: string, data?: any) => {
		try {
			addLog("info", `Quick Action: ${method} ${url}`);
			const res = await axios({
				method,
				url,
				data,
				headers: {
					Authorization: token ? `Bearer ${token}` : undefined,
				},
			});
			addLog("api", res.data);
		} catch (err: any) {
			addLog("error", err.response?.data || err.message);
		}
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium text-muted-foreground">Database</CardTitle>
				</CardHeader>
				<CardContent>
					<Button
						variant="destructive"
						className="w-full justify-start"
						onClick={() => callApi("GET", "/api/debug/seed")}>
						<RefreshCcw className="mr-2 h-4 w-4" />
						Reset & Seed DB
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium text-muted-foreground">General Info</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<Button
						variant="outline"
						className="w-full justify-start"
						onClick={() => callApi("GET", "/health")}>
						<HeartPulse className="mr-2 h-4 w-4" />
						Check Health
					</Button>
					<Button
						variant="outline"
						className="w-full justify-start"
						onClick={() => callApi("POST", "/api/lobby/list")}>
						<List className="mr-2 h-4 w-4" />
						List Games (Lobby)
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium text-muted-foreground">Game Presets</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<Button
						variant="secondary"
						className="w-full justify-start"
						onClick={() => emit("join-game", "game-id-here")}>
						<LogIn className="mr-2 h-4 w-4" />
						Join Game (Socket)
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
