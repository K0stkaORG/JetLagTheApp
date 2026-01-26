import { useState } from "react";
import axios from "axios";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AuthScreen() {
	const { token, setToken, user, setUser, addLog, disconnectSocket } = useAppContext();

	const [username, setUsername] = useState("test");
	const [password, setPassword] = useState("test");

	const handleLogin = async () => {
		try {
			const res = await axios.post("/api/auth/login", { nickname: username, password });
			addLog("api", res.data);
			if (res.data.token) {
				setToken(res.data.token);
				setUser(res.data.user);
				addLog("info", `Logged in as ${res.data.user.nickname}`);
			}
		} catch (err: any) {
			addLog("error", err.response?.data || err.message);
		}
	};

	const handleRegister = async () => {
		try {
			const res = await axios.post("/api/auth/register", { nickname: username, password });
			addLog("api", res.data);
		} catch (err: any) {
			addLog("error", err.response?.data || err.message);
		}
	};

	const handleLogout = () => {
		setToken("");
		setUser(null);
		addLog("info", "Logged out");
		disconnectSocket();
	};

	return (
		<Card className="max-w-md mx-auto">
			<CardHeader>
				<CardTitle>Authentication</CardTitle>
				<CardDescription>Login or Register to get an access token</CardDescription>
			</CardHeader>
			<CardContent>
				{!token ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<Input
								placeholder="Nickname"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
							<Input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						<div className="flex gap-2">
							<Button
								className="flex-1"
								onClick={handleLogin}>
								Login
							</Button>
							<Button
								variant="outline"
								className="flex-1"
								onClick={handleRegister}>
								Register
							</Button>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div className="p-4 bg-muted rounded-md mb-4 text-center">
							<div className="text-sm font-medium">Logged in as</div>
							<div className="text-xl font-bold text-primary">{user?.nickname}</div>
							<div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px] mx-auto">
								{user?.id}
							</div>
						</div>
						<Button
							variant="destructive"
							className="w-full"
							onClick={handleLogout}>
							Logout
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
