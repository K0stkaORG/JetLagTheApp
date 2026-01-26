import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SocketScreen() {
	const { isConnected, socket, connectSocket, disconnectSocket, addLog, gameId, setGameId } = useAppContext();

	// Socket Emit State
	const [eventName, setEventName] = useState("");
	const [eventData, setEventData] = useState("{}");

	const handleSocketEmit = () => {
		if (!socket || !isConnected) {
			addLog("error", "Socket not connected");
			return;
		}
		try {
			const data = JSON.parse(eventData);
			socket.emit(eventName, data);
			addLog("socket-out", { event: eventName, data });
		} catch (err) {
			addLog("error", "Invalid JSON for event data");
		}
	};

	return (
		<div className="space-y-6 max-w-2xl mx-auto">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-lg">Connection Status</CardTitle>
					<Badge variant={isConnected ? "default" : "destructive"}>
						{isConnected ? "CONNECTED" : "DISCONNECTED"}
					</Badge>
				</CardHeader>
				<CardContent>
					<div className="mb-4">
						<label className="text-sm font-medium mb-1 block">Game ID</label>
						<Input
							placeholder="Enter Game ID"
							value={gameId}
							onChange={(e) => setGameId(e.target.value)}
							disabled={isConnected}
						/>
					</div>
					<div className="flex gap-4">
						<Button
							className="flex-1"
							disabled={isConnected}
							onClick={connectSocket}>
							Connect
						</Button>
						<Button
							className="flex-1"
							variant="destructive"
							disabled={!isConnected}
							onClick={disconnectSocket}>
							Disconnect
						</Button>
					</div>
					{socket && (
						<div className="text-xs text-muted-foreground mt-2 text-center">Socket ID: {socket.id}</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Emit Event</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						placeholder="Event Name (e.g., join-game)"
						value={eventName}
						onChange={(e) => setEventName(e.target.value)}
					/>
					<Textarea
						placeholder="Event Data (JSON)"
						value={eventData}
						onChange={(e) => setEventData(e.target.value)}
						className="font-mono min-h-[120px]"
					/>
					<Button
						onClick={handleSocketEmit}
						disabled={!isConnected}
						className="w-full">
						Emit Event
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
