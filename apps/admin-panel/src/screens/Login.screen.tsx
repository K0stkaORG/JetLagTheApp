import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/lib/auth";
import { useServer } from "@/lib/server";

import { AdminLoginRequest, type AdminLoginResponse } from "@jetlag/shared-types";
import { LogIn, Plane } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

const LoginScreen = () => {
	const { updateToken } = useAuthContext();

	const form = useForm<AdminLoginRequest>({
		defaultValues: {
			username: "",
			password: "",
		},
	});

	const onSubmit = useCallback(async (data: AdminLoginRequest) => {
		const response = await useServer<AdminLoginRequest, AdminLoginResponse>({
			path: "/login",
			anonymous: true,
			data,
		});

		if (response.result === "success") updateToken(response.data.token);
	}, []);

	return (
		<div className="w-dvw h-dvh flex items-center-safe justify-center-safe flex-col bg-linear-to-br from-primary/20 via-background to-secondary/30">
			<div className="mb-8 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
				<div className="bg-primary text-primary-foreground p-3 rounded-2xl shadow-lg">
					<Plane className="size-8" />
				</div>
				<h1 className="text-2xl font-bold tracking-tight text-foreground/80">JetLag Admin</h1>
			</div>

			<Card className="w-md shadow-2xl border-border/50 bg-card/80 backdrop-blur-sm animate-in zoom-in-95 duration-500">
				<CardHeader>
					<CardTitle>Welcome Back</CardTitle>
					<CardDescription>Please log in to manage your JetLag games and datasets.</CardDescription>
				</CardHeader>
				<Form {...form}>
					<CardContent className="flex flex-col gap-4">
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input
											placeholder="admin"
											className="bg-background/50"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="********"
											className="bg-background/50"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
					<CardFooter>
						<Button
							onClick={() => onSubmit(form.getValues())}
							className="w-full flex items-center justify-center gap-2 shadow-sm font-bold">
							<LogIn className="size-4" />
							Log In
						</Button>
					</CardFooter>
				</Form>
			</Card>
		</div>
	);
};

export default LoginScreen;
