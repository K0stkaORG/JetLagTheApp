import { Activity, ArrowRight, LogOut, MapPin, Play, RefreshCw, Send, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useAppContext } from "@/context/AppContext";

interface JoinAdvertisement {
	id: number;
	type: string;
	gameTime: number;
	phase: string;
}

export function UserFlowScreen() {
	const { user, isConnected } = useAppContext();
	const [activeGameId, setActiveGameId] = useState<number | null>(null);
	const [step, setStep] = useState<"auth" | "lobby" | "game">("auth");

	// Sync step with user auth
	useEffect(() => {
		if (!user) {
			setStep("auth");
		} else if (activeGameId && isConnected) {
			setStep("game");
		} else {
			setStep("lobby");
		}
	}, [user, activeGameId, isConnected]);

	if (step === "auth") return <AuthView />;
	if (step === "lobby") return <LobbyView setActiveGameId={setActiveGameId} />;
	if (step === "game")
		return (
			<GameView
				activeGameId={activeGameId}
				setActiveGameId={setActiveGameId}
			/>
		);

	return null;
}

function AuthView() {
	const { setToken, setUser, addLog } = useAppContext();
	const [nickname, setNickname] = useState("test");
	const [password, setPassword] = useState("test");
	const [loading, setLoading] = useState(false);

	const handleLogin = async () => {
		setLoading(true);
		try {
			const res = await axios.post("/api/auth/login", { nickname, password });
			if (res.data.token) {
				setToken(res.data.token);
				setUser(res.data.user);
				addLog("info", `Logged in as ${res.data.user.nickname}`);
			}
		} catch (err: any) {
			addLog("error", err.response?.data?.message || err.message || "Login failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="max-w-md mx-auto my-auto w-full">
			<CardHeader>
				<CardTitle>User Login</CardTitle>
				<CardDescription>Step 1: Authenticate to enter the app flow</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<label
						htmlFor="nickname"
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
						Nickname
					</label>
					<Input
						id="nickname"
						placeholder="Nickname"
						value={nickname}
						onChange={(e) => setNickname(e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<label
						htmlFor="password"
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
						Password
					</label>
					<Input
						id="password"
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>
				<Button
					className="w-full"
					onClick={handleLogin}
					disabled={loading}>
					{loading ? "Logging in..." : "Login"}
					{!loading && <ArrowRight className="ml-2 h-4 w-4" />}
				</Button>
			</CardContent>
			<CardFooter className="justify-center text-xs text-muted-foreground">
				Use "test" / "test" for seeded account
			</CardFooter>
		</Card>
	);
}

function LobbyView({ setActiveGameId }: { setActiveGameId: (id: number) => void }) {
	const { token, setGameId, addLog, connectSocket, setUser, setToken, disconnectSocket } = useAppContext();
	const [games, setGames] = useState<JoinAdvertisement[]>([]);
	const [loadingGames, setLoadingGames] = useState(false);

	const fetchGames = async () => {
		if (!token) return;
		setLoadingGames(true);
		try {
			const res = await axios.post(
				"/api/lobby/list",
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			setGames(res.data);
			addLog("api", `Fetched ${res.data.length} games`);
		} catch (err: any) {
			addLog("error", err.response?.data || "Failed to fetch games");
		} finally {
			setLoadingGames(false);
		}
	};

	useEffect(() => {
		fetchGames();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	const joinGame = (gameId: number) => {
		setGameId(gameId.toString());
		setActiveGameId(gameId); // Optimistically set active game ID to trigger transition
		addLog("info", `Connecting socket to join game ${gameId}...`);
		connectSocket(gameId.toString());
	};

	const handleLogout = () => {
		setToken("");
		setUser(null);
		setActiveGameId(0); // Effectively null, handled by parent logic not to show GameView
		disconnectSocket();
	};

	return (
		<div className="space-y-4 max-w-4xl mx-auto px-4 py-8 w-full">
			<div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
				<div>
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Users className="h-6 w-6" /> Lobby
					</h2>
					<p className="text-muted-foreground text-sm">Step 2: Join a game</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={fetchGames}
						disabled={loadingGames}>
						<RefreshCw className={`h-4 w-4 mr-2 ${loadingGames ? "animate-spin" : ""}`} />
						Refresh
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}>
						<LogOut className="h-4 w-4 mr-2" />
						Logout
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{games.map((game) => (
					<Card
						key={game.id}
						className="hover:shadow-md transition-shadow">
						<CardHeader className="pb-2">
							<div className="flex justify-between items-start">
								<CardTitle className="text-lg">Game #{game.id}</CardTitle>
								<Badge
									className={
										game.phase === "in-progress" ? "" : "bg-secondary text-secondary-foreground"
									}>
									{game.phase}
								</Badge>
							</div>
							<CardDescription className="capitalize font-medium text-foreground/80">
								{game.type}
							</CardDescription>
						</CardHeader>
						<CardContent className="pb-2">
							<div className="text-sm text-muted-foreground flex gap-4">
								<span>
									Time: {Math.floor(game.gameTime / 60)}m {game.gameTime % 60}s
								</span>
							</div>
						</CardContent>
						<CardFooter>
							<Button
								className="w-full"
								onClick={() => joinGame(game.id)}>
								<Play className="mr-2 h-4 w-4" /> Join Game
							</Button>
						</CardFooter>
					</Card>
				))}

				{games.length === 0 && !loadingGames && (
					<div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/5">
						<p className="font-medium">No games found</p>
						<p className="text-sm mt-1">Seed the database in "Quick Actions" tab.</p>
						<Button
							variant="link"
							onClick={fetchGames}
							className="mt-2 text-primary">
							Refresh Games
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

type Cords = [number, number];

interface GamePlayer {
	id: number;
	nickname: string;
	colors: {
		light: string;
		dark: string;
	};
	position: {
		cords: Cords;
		gameTime: number;
	};
	isOnline: boolean;
}

interface GameState {
	game: {
		id: number;
		type: "hideAndSeek" | "roundabout";
	};
	timeline: {
		sync: Date;
		gameTime: number;
		phase: "not-started" | "in-progress" | "paused" | "ended";
	};
	players: Map<number, GamePlayer>;
}

function GameView({
	activeGameId,
	setActiveGameId,
}: {
	activeGameId: number | null;
	setActiveGameId: (id: number | null) => void;
}) {
	const { socket, disconnectSocket, addLog, user } = useAppContext();

	// Game state from joinDataPacket
	const [gameState, setGameState] = useState<GameState | null>(null);

	// Local state for position input
	const [myPosition, setMyPosition] = useState<Cords>([0, 0]);
	const [lastSent, setLastSent] = useState<Date | null>(null);

	// Handle initial joinDataPacket
	useEffect(() => {
		if (!socket) return;

		const handleJoinDataPacket = (data: any) => {
			addLog("socket-in", { event: "general.game.joinDataPacket", data });

			// Initialize game state from join packet
			const playersMap = new Map<number, GamePlayer>();
			data.players.forEach((player: any) => {
				playersMap.set(player.id, player);
			});

			setGameState({
				game: data.game,
				timeline: {
					...data.timeline,
					sync: new Date(data.timeline.sync),
				},
				players: playersMap,
			});

			// Set my initial position from the join packet
			const myPlayer = data.players.find((p: any) => p.id === Number(user?.id));
			if (myPlayer) {
				setMyPosition(myPlayer.position.cords);
			}
		};

		// Handle position update deltas
		const handlePositionUpdate = (data: { userId: number; cords: Cords; gameTime: number }) => {
			addLog("socket-in", { event: "general.player.positionUpdate", data });

			setGameState((prev) => {
				if (!prev) return prev;

				const newPlayers = new Map(prev.players);
				const player = newPlayers.get(data.userId);

				if (player) {
					newPlayers.set(data.userId, {
						...player,
						position: {
							cords: data.cords,
							gameTime: data.gameTime,
						},
					});
				}

				return {
					...prev,
					players: newPlayers,
				};
			});
		};

		// Handle online status deltas
		const handleIsOnlineUpdate = (data: { userId: number; isOnline: boolean }) => {
			addLog("socket-in", { event: "general.player.isOnlineUpdate", data });

			setGameState((prev) => {
				if (!prev) return prev;

				const newPlayers = new Map(prev.players);
				const player = newPlayers.get(data.userId);

				if (player) {
					newPlayers.set(data.userId, {
						...player,
						isOnline: data.isOnline,
					});
				}

				return {
					...prev,
					players: newPlayers,
				};
			});
		};

		socket.on("general.game.joinDataPacket", handleJoinDataPacket);
		socket.on("general.player.positionUpdate", handlePositionUpdate);
		socket.on("general.player.isOnlineUpdate", handleIsOnlineUpdate);

		return () => {
			socket.off("general.game.joinDataPacket", handleJoinDataPacket);
			socket.off("general.player.positionUpdate", handlePositionUpdate);
			socket.off("general.player.isOnlineUpdate", handleIsOnlineUpdate);
		};
	}, [socket, addLog, user]);

	const sendPosition = () => {
		if (!socket) return;
		socket.emit("general.player.positionUpdate", { cords: myPosition });
		setLastSent(new Date());
		addLog("socket-out", { event: "general.player.positionUpdate", data: { cords: myPosition } });
	};

	const sendRandomPosition = () => {
		const randomCords: Cords = [
			Math.random() * 180 - 90, // Latitude: -90 to 90
			Math.random() * 360 - 180, // Longitude: -180 to 180
		];
		setMyPosition(randomCords);
		// Send after state updates
		setTimeout(() => {
			if (socket) {
				socket.emit("general.player.positionUpdate", { cords: randomCords });
				setLastSent(new Date());
				addLog("socket-out", { event: "general.player.positionUpdate", data: { cords: randomCords } });
			}
		}, 0);
	};

	const leaveGame = () => {
		setActiveGameId(null);
		disconnectSocket();
		setGameState(null);
		addLog("info", "Left game view & disconnected socket");
	};

	const handleCoordChange = (idx: 0 | 1, val: string) => {
		const num = parseFloat(val);
		if (isNaN(num)) return;
		const newPos: Cords = [...myPosition];
		newPos[idx] = num;
		setMyPosition(newPos);
	};

	// Filter out my own player from the list
	const otherPlayers = gameState
		? Array.from(gameState.players.values()).filter((p) => p.id !== Number(user?.id))
		: [];

	return (
		<div className="space-y-4 max-w-4xl mx-auto px-4 py-8 w-full h-full flex flex-col">
			<Card className="flex-1 flex flex-col shadow-md">
				<CardHeader className="border-b bg-muted/5">
					<div className="flex justify-between items-center">
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5 text-green-500" />
							{gameState ? (
								<>
									Game #{gameState.game.id}
									<Badge
										variant="outline"
										className="ml-2 text-xs capitalize">
										{gameState.game.type}
									</Badge>
									<Badge
										variant="secondary"
										className="ml-2 text-xs capitalize">
										{gameState.timeline.phase}
									</Badge>
								</>
							) : (
								<>Active Game #{activeGameId}</>
							)}
						</CardTitle>
						<Badge className="font-mono text-xs">Socket: {socket?.id || "Disconnected"}</Badge>
					</div>
					<CardDescription>Game Mock-up - Simulates Real Game Experience</CardDescription>
				</CardHeader>

				<CardContent className="flex-1 p-6 space-y-6">
					{!gameState ? (
						<div className="flex flex-col items-center justify-center p-12">
							<RefreshCw className="h-8 w-8 mb-2 opacity-50 animate-spin" />
							<p className="font-medium">Waiting for game data...</p>
							<p className="text-sm text-muted-foreground mt-1">Connecting to game #{activeGameId}</p>
						</div>
					) : (
						<>
							{/* My Position Control */}
							<div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
								<h3 className="font-semibold flex items-center gap-2">
									<MapPin className="h-4 w-4 text-primary" /> My Position
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium mb-2 block">Latitude</label>
										<Input
											type="number"
											value={myPosition[0]}
											onChange={(e) => handleCoordChange(0, e.target.value)}
											placeholder="-90 to 90"
											step="0.0001"
											className="font-mono"
										/>
										<p className="text-xs text-muted-foreground mt-1">Range: -90° to 90°</p>
									</div>
									<div>
										<label className="text-sm font-medium mb-2 block">Longitude</label>
										<Input
											type="number"
											value={myPosition[1]}
											onChange={(e) => handleCoordChange(1, e.target.value)}
											placeholder="-180 to 180"
											step="0.0001"
											className="font-mono"
										/>
										<p className="text-xs text-muted-foreground mt-1">Range: -180° to 180°</p>
									</div>
								</div>
								<div className="flex gap-2 flex-wrap">
									<Button
										onClick={sendPosition}
										className="flex-1 min-w-[140px]">
										<Send className="mr-2 h-4 w-4" />
										Send Position
									</Button>
									<Button
										onClick={sendRandomPosition}
										variant="outline"
										className="flex-1 min-w-[140px]">
										<RefreshCw className="mr-2 h-4 w-4" />
										Random Position
									</Button>
								</div>
								{lastSent && (
									<p className="text-xs text-muted-foreground text-right">
										Last sent: {lastSent.toLocaleTimeString()}
									</p>
								)}
							</div>

							{/* Other Players */}
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<h3 className="font-semibold flex items-center gap-2">
										<Users className="h-4 w-4 text-orange-500" /> Other Players
									</h3>
									<Badge variant="outline">{otherPlayers.length} players</Badge>
								</div>

								{otherPlayers.length === 0 ? (
									<div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/5">
										<Users className="h-8 w-8 mb-2 opacity-50" />
										<p className="font-medium">No other players in this game</p>
									</div>
								) : (
									<div className="space-y-2 max-h-96 overflow-y-auto">
										{otherPlayers.map((p) => (
											<div
												key={p.id}
												className="p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
												<div className="flex items-start justify-between gap-4">
													<div className="flex-1 space-y-1 min-w-0">
														<div className="flex items-center gap-2">
															<div
																className="w-3 h-3 rounded-full"
																style={{ backgroundColor: p.colors.light }}
															/>
															<span className="font-semibold">{p.nickname}</span>
															<Badge
																variant={p.isOnline ? "default" : "secondary"}
																className="text-xs">
																{p.isOnline ? "🟢 Online" : "🔘 Offline"}
															</Badge>
														</div>
														<div className="text-sm space-y-1">
															<div>
																<span className="text-muted-foreground">Lat:</span>
																<span className="font-mono ml-2">
																	{p.position.cords[0].toFixed(6)}
																</span>
															</div>
															<div>
																<span className="text-muted-foreground">Lon:</span>
																<span className="font-mono ml-2">
																	{p.position.cords[1].toFixed(6)}
																</span>
															</div>
															<div>
																<span className="text-muted-foreground">
																	Game Time:
																</span>
																<span className="font-mono ml-2">
																	{p.position.gameTime}s
																</span>
															</div>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</>
					)}
				</CardContent>

				<CardFooter className="justify-between border-t p-6 bg-muted/5">
					<div className="text-sm text-muted-foreground">
						Logged in as: <span className="font-medium text-foreground">{user?.nickname}</span>
					</div>
					<Button
						variant="destructive"
						onClick={leaveGame}>
						<LogOut className="mr-2 h-4 w-4" /> Leave Game
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
