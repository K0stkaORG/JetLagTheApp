import { useEffect, useMemo, useState } from "react";
import type { Cords } from "@jetlag/shared-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppContext } from "@/context/AppContext";

interface PlayerState {
	id: number;
	nickname: string;
	colors: { light: string; dark: string };
	position: { cords: Cords; gameTime: number };
	isOnline: boolean;
}

interface GameState {
	gameId: number;
	type: "hideAndSeek" | "roundabout";
	timeline: {
		sync: Date | null;
		gameTime: number;
		phase: "not-started" | "in-progress" | "paused" | "ended";
	};
	players: PlayerState[];
}

export function GameStep({ activeGameId }: { activeGameId: number | null }) {
	const { socket, isConnected, emitSocket, disconnectSocket, addLog, joinPacket } = useAppContext();
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [cords, setCords] = useState<Cords>([0, 0]);
	const [notifications, setNotifications] = useState<string[]>([]);
	const [displayGameTime, setDisplayGameTime] = useState<number | null>(null);

	const computeGameTime = (timeline: GameState["timeline"]) => {
		if (timeline.phase !== "in-progress") return timeline.gameTime;
		if (!timeline.sync) return timeline.gameTime;
		const deltaSeconds = (Date.now() - timeline.sync.getTime()) / 1000;
		return timeline.gameTime + deltaSeconds;
	};

	useEffect(() => {
		if (!joinPacket) return;
		setGameState({
			gameId: joinPacket.game.id,
			type: joinPacket.game.type,
			timeline: {
				sync: joinPacket.timeline.sync,
				gameTime: joinPacket.timeline.gameTime,
				phase: joinPacket.timeline.phase,
			},
			players: joinPacket.players,
		});
	}, [joinPacket]);

	useEffect(() => {
		if (!gameState) {
			setDisplayGameTime(null);
			return;
		}
		setDisplayGameTime(computeGameTime(gameState.timeline));
		if (gameState.timeline.phase !== "in-progress") return;
		const interval = setInterval(() => {
			setDisplayGameTime(computeGameTime(gameState.timeline));
		}, 250);
		return () => clearInterval(interval);
	}, [gameState]);

	useEffect(() => {
		if (!socket) return;

		const handlePositionUpdate = (data: { userId: number; cords: Cords; gameTime: number }) => {
			setGameState((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					players: prev.players.map((player) =>
						player.id === data.userId
							? { ...player, position: { cords: data.cords, gameTime: data.gameTime } }
							: player,
					),
				};
			});
		};

		const handleOnlineUpdate = (data: { userId: number; isOnline: boolean }) => {
			setGameState((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					players: prev.players.map((player) =>
						player.id === data.userId ? { ...player, isOnline: data.isOnline } : player,
					),
				};
			});
		};

		const handleTimeline = (
			data: { sync: Date | string; gameTime?: number },
			phase: GameState["timeline"]["phase"],
		) => {
			setGameState((prev) =>
				prev
					? {
							...prev,
							timeline: {
								sync: data.sync ? new Date(data.sync) : prev.timeline.sync,
								gameTime: data.gameTime ?? prev.timeline.gameTime,
								phase,
							},
						}
					: prev,
			);
		};

		socket.on("general.player.positionUpdate", handlePositionUpdate);
		socket.on("general.player.isOnlineUpdate", handleOnlineUpdate);
		socket.on("general.timeline.start", (data) => handleTimeline(data, "in-progress"));
		socket.on("general.timeline.pause", (data) => handleTimeline(data, "paused"));
		socket.on("general.timeline.resume", (data) => handleTimeline(data, "in-progress"));
		socket.on("general.notification", (data) => {
			setNotifications((prev) => [data.message, ...prev].slice(0, 10));
		});
		socket.on("general.shutdown", () => {
			addLog("error", "Server requested shutdown. Disconnecting socket.");
			disconnectSocket();
		});

		return () => {
			socket.off("general.player.positionUpdate", handlePositionUpdate);
			socket.off("general.player.isOnlineUpdate", handleOnlineUpdate);
			socket.off("general.timeline.start");
			socket.off("general.timeline.pause");
			socket.off("general.timeline.resume");
			socket.off("general.notification");
			socket.off("general.shutdown");
		};
	}, [socket, addLog, disconnectSocket]);

	const sendPosition = () => {
		emitSocket("general.player.positionUpdate", { cords });
	};

	const players = useMemo(() => gameState?.players ?? [], [gameState]);

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						Game Session
						<Badge variant={isConnected ? "default" : "secondary"}>
							{isConnected ? "Socket Connected" : "Disconnected"}
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					<div>Active Game ID: {gameState?.gameId ?? activeGameId ?? "Not selected"}</div>
					<div>Game Packet: {gameState ? `#${gameState.gameId} (${gameState.type})` : "Awaiting join"}</div>
					<div>Phase: {gameState?.timeline.phase ?? "unknown"}</div>
					<div>
						Game Time: {gameState ? Math.round(displayGameTime ?? gameState.timeline.gameTime) : "--"}s
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							onClick={disconnectSocket}>
							Disconnect Socket
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Send Position Update</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-3">
					<Input
						type="number"
						value={cords[0]}
						onChange={(event) => setCords([Number(event.target.value), cords[1]])}
						placeholder="Latitude"
					/>
					<Input
						type="number"
						value={cords[1]}
						onChange={(event) => setCords([cords[0], Number(event.target.value)])}
						placeholder="Longitude"
					/>
					<Button
						onClick={sendPosition}
						disabled={!isConnected}>
						Emit Position
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Players</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Nickname</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Coords</TableHead>
								<TableHead>Game Time</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{players.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center text-muted-foreground">
										Waiting for join packet...
									</TableCell>
								</TableRow>
							) : (
								players.map((player) => (
									<TableRow key={player.id}>
										<TableCell>{player.id}</TableCell>
										<TableCell className="font-medium">{player.nickname}</TableCell>
										<TableCell>
											<Badge variant={player.isOnline ? "default" : "secondary"}>
												{player.isOnline ? "Online" : "Offline"}
											</Badge>
										</TableCell>
										<TableCell>
											{player.position.cords[0].toFixed(4)}, {player.position.cords[1].toFixed(4)}
										</TableCell>
										<TableCell>{player.position.gameTime.toFixed(1)}s</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Notifications</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm text-muted-foreground">
					{notifications.length === 0 ? (
						<div>No notifications yet.</div>
					) : (
						notifications.map((note, index) => (
							<div
								key={`${note}-${index}`}
								className="rounded-md border bg-muted/30 p-2">
								{note}
							</div>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
}
