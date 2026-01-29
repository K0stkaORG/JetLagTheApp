import { useEffect, useRef, useState } from "react";
import type { JoinAdvertisement } from "@jetlag/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/context/AppContext";
import { RefreshCw } from "lucide-react";

export function LobbyStep({ onJoin }: { onJoin: (gameId: number) => void }) {
	const { apiRequest, token, setToken, setUser, setAuthError, disconnectSocket } = useAppContext();
	const [games, setGames] = useState<JoinAdvertisement[]>([]);
	const [loading, setLoading] = useState(false);
	const lastTokenRef = useRef<string | null>(null);

	const fetchGames = async () => {
		if (!token) return;
		setLoading(true);
		try {
			const response = await apiRequest<JoinAdvertisement[]>({
				method: "POST",
				path: "/api/lobby/list",
				body: {},
			});
			setGames(response);
		} catch {
			setGames([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!token) {
			lastTokenRef.current = null;
			return;
		}
		if (lastTokenRef.current === token) return;
		lastTokenRef.current = token;
		fetchGames();
	}, [token]);

	const handleLogout = () => {
		disconnectSocket();
		setToken("");
		setUser(null);
		setAuthError(null);
		setGames([]);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">Lobby</h3>
					<p className="text-sm text-muted-foreground">Available games for the current user.</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={fetchGames}
						disabled={loading || !token}>
						<RefreshCw className={"mr-2 h-4 w-4" + (loading ? " animate-spin" : "")} />
						Refresh
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}
						disabled={!token}>
						Logout
					</Button>
				</div>
			</div>

			{token ? (
				games.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-center text-sm text-muted-foreground">
							No games available yet.
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-3 md:grid-cols-2">
						{games.map((game) => (
							<Card key={game.id}>
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										Game #{game.id}
										<Badge variant="secondary">{game.type}</Badge>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2 text-sm">
									<div>Phase: {game.phase}</div>
									<div>Game Time: {Math.round(game.gameTime)}s</div>
									<div>
										Players: {game.players.online} / {game.players.total}
									</div>
									<Button
										className="w-full"
										onClick={() => onJoin(game.id)}>
										Join via Socket
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				)
			) : (
				<Card>
					<CardContent className="py-8 text-center text-sm text-muted-foreground">
						Login first to view lobby games.
					</CardContent>
				</Card>
			)}
		</div>
	);
}
