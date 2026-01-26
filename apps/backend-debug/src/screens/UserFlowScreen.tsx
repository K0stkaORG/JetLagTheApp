import { useState, useEffect } from "react";
import axios from "axios";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, LogOut, MapPin, Activity, RefreshCw } from "lucide-react";

interface JoinAdvertisement {
	id: number;
	type: string;
	gameTime: number;
	phase: string;
}

export function UserFlowScreen() {
	const { user, token, setToken, setUser, addLog, isConnected, connectSocket, socket, disconnectSocket } =
		useAppContext();
	const [step, setStep] = useState<"auth" | "lobby" | "game">("auth");

	// Auth State
	const [nickname, setNickname] = useState("test");
	const [password, setPassword] = useState("test");

	// Lobby State
	const [games, setGames] = useState<JoinAdvertisement[]>([]);
	const [loadingGames, setLoadingGames] = useState(false);
	const [pendingGameId, setPendingGameId] = useState<number | null>(null);

	// Game State
	const [activeGameId, setActiveGameId] = useState<number | null>(null);

	// Sync step with user auth
	useEffect(() => {
		if (!user) {
			setStep("auth");
		} else if (activeGameId) {
			setStep("game");
		} else {
			setStep("lobby");
		}
	}, [user, activeGameId]);

	// Fetch games when entering lobby
	useEffect(() => {
		if (step === "lobby") {
			fetchGames();
		}
	}, [step]);

	// Auto-join game when socket connects if pending
	useEffect(() => {
		if (isConnected && pendingGameId && socket) {
			addLog("info", `Socket connected. Joining game ${pendingGameId}...`);
			socket.emit("join-game", pendingGameId.toString());
			setActiveGameId(pendingGameId);
			setPendingGameId(null);
		}
	}, [isConnected, pendingGameId, socket, addLog]);

	const handleLogin = async () => {
		try {
			const res = await axios.post("/api/auth/login", { nickname, password });
			if (res.data.token) {
				setToken(res.data.token);
				setUser(res.data.user);
				addLog("info", `Logged in as ${res.data.user.nickname}`);
			}
		} catch (err: any) {
			addLog("error", err.response?.data?.message || err.message || "Login failed");
		}
	};

	const handleLogout = () => {
		setToken("");
		setUser(null);
		setActiveGameId(null);
		disconnectSocket();
	};

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

	const joinGame = (gameId: number) => {
		if (isConnected) {
			// Already connected (e.g. from another tab or manual connect), just join
			addLog("info", `Joining game ${gameId}...`);
			socket?.emit("join-game", gameId.toString());
			setActiveGameId(gameId);
		} else {
			// Needs connection
			addLog("info", `Connecting socket to join game ${gameId}...`);
			setPendingGameId(gameId);
			connectSocket();
		}
	};

	const leaveGame = () => {
		setActiveGameId(null);
		disconnectSocket();
		addLog("info", "Left game view & disconnected socket");
	};

	if (step === "auth") {
		return (
			<Card className="max-w-md mx-auto my-auto">
				<CardHeader>
					<CardTitle>User Login</CardTitle>
					<CardDescription>Step 1: Authenticate to enter the app flow</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Input
							placeholder="Nickname"
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							className="mb-2"
						/>
						<Input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>
					<Button
						className="w-full"
						onClick={handleLogin}>
						Login
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (step === "lobby") {
		return (
			<div className="space-y-4 max-w-4xl mx-auto px-4">
				<div className="flex justify-between items-center">
					<div>
						<h2 className="text-2xl font-bold">Lobby</h2>
						<p className="text-muted-foreground">Step 2: Join a game</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="icon"
							onClick={fetchGames}
							title="Refresh Games">
							<RefreshCw className={`h-4 w-4 ${loadingGames ? "animate-spin" : ""}`} />
						</Button>
						<Button
							variant="ghost"
							onClick={handleLogout}>
							Logout
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{games.map((game) => (
						<Card key={game.id}>
							<CardHeader>
								<CardTitle className="flex justify-between items-center text-lg">
									<span>Game #{game.id}</span>
									<Badge variant={game.phase === "in-progress" ? "default" : "secondary"}>
										{game.phase}
									</Badge>
								</CardTitle>
								<CardDescription className="uppercase text-xs font-semibold tracking-wider">
									{game.type}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-sm text-muted-foreground">
									Game Time: {Math.floor(game.gameTime / 60)}m {game.gameTime % 60}s
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
						<div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
							<p>No games found.</p>
							<p className="text-sm">Seed the database in "Quick Actions" tab.</p>
							<Button
								variant="link"
								onClick={fetchGames}
								className="mt-2">
								Refresh
							</Button>
						</div>
					)}
				</div>
			</div>
		);
	}

	if (step === "game") {
		return (
			<div className="space-y-4 max-w-4xl mx-auto px-4 w-full h-full pb-4 flex flex-col">
				<Card className="flex-1 flex flex-col">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5 text-green-500" />
							Active Game #{activeGameId}
						</CardTitle>
						<CardDescription>Step 3: Play</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 flex flex-col items-center justify-center bg-muted/10 m-4 rounded-xl border-2 border-dashed">
						<div className="text-center space-y-4">
							<div className="bg-primary/10 p-6 rounded-full inline-block">
								<MapPin className="h-12 w-12 text-primary" />
							</div>
							<div>
								<h3 className="text-xl font-semibold">Game Simulation View</h3>
								<p className="text-muted-foreground max-w-sm mx-auto mt-2">
									You are actively joined to this game channel. Here you would see the map and player
									controls.
								</p>
							</div>
							<div className="flex gap-2 justify-center mt-4">
								<Button variant="secondary">Send Location</Button>
								<Button variant="secondary">Check Balance</Button>
							</div>
						</div>
					</CardContent>
					<CardFooter className="justify-between border-t p-6">
						<div className="text-sm text-muted-foreground">Socket: {socket?.id}</div>
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

	return null;
}
