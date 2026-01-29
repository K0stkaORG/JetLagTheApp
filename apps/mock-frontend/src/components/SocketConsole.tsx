import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/context/AppContext";

export function SocketConsole() {
	const { emitSocket, isConnected, addLog } = useAppContext();
	const { toast } = useToast();
	const [eventName, setEventName] = useState("general.player.positionUpdate");
	const [payload, setPayload] = useState("{}");

	const handleEmit = () => {
		try {
			const data = payload.trim() ? JSON.parse(payload) : {};
			emitSocket(eventName as never, data);
			toast({ title: "Socket event sent", description: eventName });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Invalid JSON";
			addLog("error", message);
			toast({ title: "Socket event failed", description: message, variant: "destructive" });
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Socket Console</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>Connection: {isConnected ? "Connected" : "Disconnected"}</span>
				</div>
				<Input
					value={eventName}
					onChange={(event) => setEventName(event.target.value)}
					placeholder="general.player.positionUpdate"
				/>
				<Textarea
					value={payload}
					onChange={(event) => setPayload(event.target.value)}
					placeholder='{"cords": [0, 0]}'
					className="min-h-[120px] font-mono text-xs"
				/>
				<Button
					className="w-full"
					onClick={handleEmit}
					disabled={!isConnected}>
					Emit Event
				</Button>
			</CardContent>
		</Card>
	);
}
