import { AppProvider, useAppContext } from "./context/AppContext";
import { LogViewer } from "./components/LogViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthScreen } from "./screens/AuthScreen";
import { SocketScreen } from "./screens/SocketScreen";
import { ApiScreen } from "./screens/ApiScreen";
import { QuickActionsScreen } from "./screens/QuickActionsScreen";
import { UserFlowScreen } from "./screens/UserFlowScreen";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import axios from "axios";

function AppContent() {
	const { user, setToken, setUser, addLog, disconnectSocket } = useAppContext();

	useEffect(() => {
		const interceptor = axios.interceptors.response.use(
			(response) => response,
			async (error) => {
				if (error.response?.status === 401 || error.response?.status === 403) {
					addLog("error", "Session expired or invalid token. Logging out.");
					setToken("");
					setUser(null);
					disconnectSocket();
				}
				return Promise.reject(error);
			},
		);

		return () => {
			axios.interceptors.response.eject(interceptor);
		};
	}, [setToken, setUser, addLog, disconnectSocket]);

	return (
		<div className="flex h-screen w-full bg-background overflow-hidden">
			{/* Main Content Area */}
			<div className="flex-1 flex flex-col min-w-0">
				<header className="border-b px-6 py-3 flex items-center justify-between bg-card/50 backdrop-blur">
					<h1 className="font-bold text-xl tracking-tight">JetLag Debugger</h1>
					<div className="text-sm text-muted-foreground">
						{user ? `Welcome, ${user.nickname}` : "Not Authenticated"}
					</div>
				</header>

				<main className="flex-1 overflow-hidden p-4">
					<Tabs
						defaultValue="flow"
						className="h-full flex flex-col">
						<TabsList className="grid w-full grid-cols-5 max-w-4xl mx-auto mb-4">
							<TabsTrigger value="flow">User Flow</TabsTrigger>
							<TabsTrigger value="auth">Auth</TabsTrigger>
							<TabsTrigger value="socket">Socket.IO</TabsTrigger>
							<TabsTrigger value="api">API</TabsTrigger>
							<TabsTrigger value="quick">Quick Actions</TabsTrigger>
						</TabsList>

						<div className="flex-1 overflow-y-auto py-4">
							<TabsContent
								value="flow"
								className="mt-0 h-full">
								<UserFlowScreen />
							</TabsContent>
							<TabsContent
								value="auth"
								className="mt-0 h-full">
								<AuthScreen />
							</TabsContent>
							<TabsContent
								value="socket"
								className="mt-0 h-full">
								<SocketScreen />
							</TabsContent>
							<TabsContent
								value="api"
								className="mt-0 h-full">
								<ApiScreen />
							</TabsContent>
							<TabsContent
								value="quick"
								className="mt-0 h-full">
								<QuickActionsScreen />
							</TabsContent>
						</div>
					</Tabs>
				</main>
			</div>

			{/* Side Panel Log Viewer */}
			<div className="w-[400px] flex-shrink-0 bg-muted/10 h-full">
				<LogViewer />
			</div>
			<Toaster />
		</div>
	);
}

function App() {
	return (
		<AppProvider>
			<AppContent />
		</AppProvider>
	);
}

export default App;
