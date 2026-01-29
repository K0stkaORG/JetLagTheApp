import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ApiConsole } from "@/components/ApiConsole";
import { DebugLog } from "@/components/DebugLog";
import { QuickActions } from "@/components/QuickActions";
import { SocketConsole } from "@/components/SocketConsole";
import { AuthStep } from "@/components/steps/AuthStep";
import { GameStep } from "@/components/steps/GameStep";
import { LobbyStep } from "@/components/steps/LobbyStep";
import { useAppContext } from "@/context/AppContext";

function App() {
	const {
		apiBaseUrl,
		setApiBaseUrl,
		socketUrl,
		setSocketUrl,
		gameId,
		setGameId,
		connectSocket,
		disconnectSocket,
		isConnected,
		logs,
		clearLogs,
		token,
		user,
		authError,
	} = useAppContext();

	const [settingsOpen, setSettingsOpen] = useState(false);
	const [toolboxOpen, setToolboxOpen] = useState(false);
	const [activeGameId, setActiveGameId] = useState<number | null>(null);

	const step = useMemo(() => {
		if (!token || !user || authError) return "auth";
		if (!isConnected) return "lobby";
		return "game";
	}, [token, user, authError, isConnected]);

	const handleJoin = (id: number) => {
		setGameId(id.toString());
		setActiveGameId(id);
		connectSocket(id.toString());
		setSettingsOpen(false);
	};

	return (
		<div className="h-screen overflow-hidden bg-muted/30">
			<div className="mx-auto flex h-full max-w-[1400px] flex-col gap-6 px-6 py-6">
				<div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
					<div>
						<h1 className="text-3xl font-semibold">Mock Frontend Debug Console</h1>
						<p className="text-sm text-muted-foreground">
							Authenticate, join games, and inspect all REST + Socket.IO traffic.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant={isConnected ? "default" : "secondary"}>
							{isConnected ? "Socket Connected" : "Socket Disconnected"}
						</Badge>
						<Dialog
							open={toolboxOpen}
							onOpenChange={setToolboxOpen}>
							<DialogTrigger asChild>
								<Button variant="outline">Toolbox</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-[720px]">
								<DialogHeader>
									<DialogTitle>Toolbox</DialogTitle>
									<DialogDescription>Quick actions, REST calls, and Socket events.</DialogDescription>
								</DialogHeader>
								<Tabs
									defaultValue="quick"
									className="space-y-4">
									<TabsList className="grid w-full grid-cols-3">
										<TabsTrigger value="quick">Quick</TabsTrigger>
										<TabsTrigger value="api">API</TabsTrigger>
										<TabsTrigger value="socket">Socket</TabsTrigger>
									</TabsList>
									<TabsContent value="quick">
										<QuickActions />
									</TabsContent>
									<TabsContent value="api">
										<ApiConsole />
									</TabsContent>
									<TabsContent value="socket">
										<SocketConsole />
									</TabsContent>
								</Tabs>
							</DialogContent>
						</Dialog>
						<Dialog
							open={settingsOpen}
							onOpenChange={setSettingsOpen}>
							<DialogTrigger asChild>
								<Button variant="outline">Connection Settings</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-[520px]">
								<DialogHeader>
									<DialogTitle>Connection Settings</DialogTitle>
									<DialogDescription>
										Configure REST + Socket endpoints and connect to a game.
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-3">
									<Input
										value={apiBaseUrl}
										onChange={(event) => setApiBaseUrl(event.target.value)}
										placeholder="REST API URL"
									/>
									<Input
										value={socketUrl}
										onChange={(event) => setSocketUrl(event.target.value)}
										placeholder="Socket URL"
									/>
									<Input
										value={gameId}
										onChange={(event) => setGameId(event.target.value)}
										placeholder="Game ID"
									/>
									<div className="flex gap-2">
										<Button
											className="w-full"
											onClick={() => connectSocket()}>
											Connect Socket
										</Button>
										<Button
											variant="outline"
											className="w-full"
											onClick={disconnectSocket}>
											Disconnect
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				<div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
					<div className="flex min-h-0 flex-col gap-4">
						<div className="flex items-center justify-between shrink-0">
							<CardTitle>
								{step === "auth" && "Authentication"}
								{step === "lobby" && "Lobby"}
								{step === "game" && "Game Session"}
							</CardTitle>
							<Badge variant="outline">Step: {step}</Badge>
						</div>
						<Separator />
						<div className="min-h-0 overflow-y-auto pr-2">
							{step === "auth" && <AuthStep />}
							{step === "lobby" && <LobbyStep onJoin={handleJoin} />}
							{step === "game" && <GameStep activeGameId={activeGameId} />}
						</div>
					</div>

					<div className="min-h-0 overflow-y-auto">
						<DebugLog
							logs={logs}
							onClear={clearLogs}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
