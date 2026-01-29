import { useState } from "react";
import { LoginRequest, RegisterRequest, type LoginResponse, type User } from "@jetlag/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

export function AuthStep() {
	const { apiRequest, setToken, setUser, token, user, addLog, authError, setAuthError } = useAppContext();
	const { toast } = useToast();
	const [loginNick, setLoginNick] = useState("test");
	const [loginPass, setLoginPass] = useState("test");
	const [registerNick, setRegisterNick] = useState("");
	const [registerPass, setRegisterPass] = useState("");

	const handleLogin = async () => {
		const parsed = LoginRequest.safeParse({ nickname: loginNick, password: loginPass });
		if (!parsed.success) {
			toast({ title: "Login error", description: parsed.error.issues[0].message, variant: "destructive" });
			return;
		}

		try {
			const response = await apiRequest<LoginResponse>({
				method: "POST",
				path: "/api/auth/login",
				body: parsed.data,
			});

			setToken(response.token);
			setUser(response.user as User);
			setAuthError(null);
			toast({ title: "Logged in", description: `Welcome ${response.user.nickname}` });
			addLog("info", "User logged in", response.user);
		} catch (error) {
			toast({ title: "Login failed", description: String(error), variant: "destructive" });
			addLog("error", "Login failed", error);
		}
	};

	const handleRegister = async () => {
		const parsed = RegisterRequest.safeParse({ nickname: registerNick, password: registerPass });
		if (!parsed.success) {
			toast({ title: "Register error", description: parsed.error.issues[0].message, variant: "destructive" });
			return;
		}

		try {
			await apiRequest({
				method: "POST",
				path: "/api/auth/register",
				body: parsed.data,
			});
			toast({ title: "Account created", description: "You can now login." });
			addLog("info", "Account registered", parsed.data.nickname);
		} catch (error) {
			toast({ title: "Register failed", description: String(error), variant: "destructive" });
			addLog("error", "Register failed", error);
		}
	};

	const handleRevalidate = async () => {
		try {
			const response = await apiRequest<{ token: string }>({
				method: "POST",
				path: "/api/auth/revalidate",
			});
			setToken(response.token);
			toast({ title: "Token refreshed" });
		} catch (error) {
			toast({ title: "Refresh failed", description: String(error), variant: "destructive" });
		}
	};

	const handleLogout = () => {
		setToken("");
		setUser(null);
		setAuthError(null);
		addLog("info", "Logged out");
	};

	return (
		<div className="space-y-6">
			{authError && (
				<Card className="border-destructive/50 bg-destructive/5">
					<CardHeader>
						<CardTitle>Authentication Required</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">{authError}</CardContent>
				</Card>
			)}
			<Card>
				<CardHeader>
					<CardTitle>Auth Status</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-2 text-sm">
					<div>Token: {token && user ? "Active" : "Not set"}</div>
					<div>User: {user ? `${user.nickname} (#${user.id})` : "No user"}</div>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							onClick={handleRevalidate}
							disabled={!token}>
							Revalidate Token
						</Button>
						<Button
							variant="ghost"
							onClick={handleLogout}
							disabled={!token}>
							Logout
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Authentication</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs
						defaultValue="login"
						className="space-y-4">
						<TabsList>
							<TabsTrigger value="login">Login</TabsTrigger>
							<TabsTrigger value="register">Register</TabsTrigger>
						</TabsList>
						<TabsContent
							value="login"
							className="space-y-3">
							<Input
								placeholder="Nickname"
								value={loginNick}
								onChange={(event) => setLoginNick(event.target.value)}
							/>
							<Input
								placeholder="Password"
								type="password"
								value={loginPass}
								onChange={(event) => setLoginPass(event.target.value)}
							/>
							<Button
								className="w-full"
								onClick={handleLogin}>
								Login
							</Button>
						</TabsContent>
						<TabsContent
							value="register"
							className="space-y-3">
							<Input
								placeholder="Nickname"
								value={registerNick}
								onChange={(event) => setRegisterNick(event.target.value)}
							/>
							<Input
								placeholder="Password"
								type="password"
								value={registerPass}
								onChange={(event) => setRegisterPass(event.target.value)}
							/>
							<Button
								className="w-full"
								onClick={handleRegister}>
								Register
							</Button>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
