import { Activity, ArrowRight, LogOut, MapPin, Play, RefreshCw, Send, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useAppContext } from "@/context/AppContext";

type Cords = [number, number];

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
	}, []);

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

interface PlayerInfo {
	userId: number;
	cords: Cords;
	gameTime: number;
	lastUpdate: Date;
}

function GameView({
	activeGameId,
	setActiveGameId,
}: {
	activeGameId: number | null;
	setActiveGameId: (id: number | null) => void;
}) {
	const { socket, disconnectSocket, addLog, user } = useAppContext();
	const [myPos, setMyPos] = useState<Cords>([0, 0]);
	const [players, setPlayers] = useState<Map<number, PlayerInfo>>(new Map());
	const [lastSent, setLastSent] = useState<Date | null>(null);

	useEffect(() => {
		if (!socket) return;

		const handlePlayerUpdate = (data: { userId: number; cords: Cords; gameTime: number }) => {
			setPlayers((prev) => {
				const next = new Map(prev);
				next.set(data.userId, {
					...data,
					lastUpdate: new Date(),
				});
				return next;
			});
			addLog("socket-in", `Received update from user ${data.userId}: [${data.cords.join(", ")}]`);
		};

		socket.on("general:playerPositionUpdate", handlePlayerUpdate);

		return () => {
			socket.off("general:playerPositionUpdate", handlePlayerUpdate);
		};
	}, [socket, addLog]);

	const sendPosition = () => {
		if (!socket) return;

		const payload = { cords: myPos };
		socket.emit("general:positionUpdate", payload);
		setLastSent(new Date());
		addLog("socket-out", `Sent position: [${myPos.join(", ")}]`);
	};

	const leaveGame = () => {
		setActiveGameId(null);
		disconnectSocket();
		addLog("info", "Left game view & disconnected socket");
	};

	const handleCoordChange = (idx: 0 | 1, val: string) => {
		const num = parseFloat(val);
		if (isNaN(num)) return;
		const newPos = [...myPos] as Cords;
		newPos[idx] = num;
		setMyPos(newPos);
	};

	return (
		<div className="space-y-4 max-w-4xl mx-auto px-4 py-8 w-full h-full flex flex-col">
			<Card className="flex-1 flex flex-col shadow-md">
				<CardHeader className="border-b bg-muted/5">
					<div className="flex justify-between items-center">
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5 text-green-500" />
							Active Game #{activeGameId}
						</CardTitle>
						<Badge className="font-mono border bg-transparent text-foreground hover:bg-muted">
							Socket: {socket?.id || "Disconnected"}
						</Badge>
					</div>
					<CardDescription>Step 3: Play & Simulate Position</CardDescription>
				</CardHeader>

				<CardContent className="flex-1 p-6 space-y-6">
					{/* My Position Control */}
					<div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
						<h3 className="font-semibold flex items-center gap-2">
							<MapPin className="h-4 w-4 text-primary" /> My Position
						</h3>
						<div className="flex gap-4 items-end">
							<div className="grid grid-cols-2 gap-4 flex-1">
								<div className="space-y-2">
									<label className="text-sm font-medium leading-none">Latitude</label>
									<Input
										type="number"
										value={myPos[0]}
										onChange={(e) => handleCoordChange(0, e.target.value)}
										step="0.0001"
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium leading-none">Longitude</label>
									<Input
										type="number"
										value={myPos[1]}
										onChange={(e) => handleCoordChange(1, e.target.value)}
										step="0.0001"
									/>
								</div>
							</div>
							<Button
								onClick={sendPosition}
								size="lg"
								className="min-w-[120px]">
								<Send className="mr-2 h-4 w-4" /> Send
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
							<Badge className="bg-secondary text-secondary-foreground">{players.size} Online</Badge>
						</div>

						<div className="border rounded-lg overflow-hidden">
							<div className="w-full text-sm">
								<div className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
									<div className="flex font-medium text-muted-foreground bg-muted/20">
										<div className="p-4 align-middle [&:has([role=checkbox])]:pr-0 flex-1">
											User ID
										</div>
										<div className="p-4 align-middle [&:has([role=checkbox])]:pr-0 flex-1">
											Latitude
										</div>
										<div className="p-4 align-middle [&:has([role=checkbox])]:pr-0 flex-1">
											Longitude
										</div>
										<div className="p-4 align-middle [&:has([role=checkbox])]:pr-0 flex-1">
											Last Update
										</div>
									</div>
								</div>
								<div className="divide-y">
									{players.size === 0 ? (
										<div className="p-4 text-center text-muted-foreground h-24 flex items-center justify-center">
											No position updates received yet.
										</div>
									) : (
										Array.from(players.values()).map((p) => (
											<div
												className="flex transition-colors hover:bg-muted/50"
												key={p.userId}>
												<div className="p-4 align-middle font-medium flex-1">#{p.userId}</div>
												<div className="p-4 align-middle flex-1">{p.cords[0].toFixed(6)}</div>
												<div className="p-4 align-middle flex-1">{p.cords[1].toFixed(6)}</div>
												<div className="p-4 align-middle flex-1">
													{p.lastUpdate.toLocaleTimeString()}
												</div>
											</div>
										))
									)}
								</div>
							</div>
						</div>
					</div>
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
