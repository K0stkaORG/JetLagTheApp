import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/lib/auth";
import { useServer } from "@/lib/server";

import { AdminLoginRequest, type AdminLoginResponse } from "@jetlag/shared-types";
import { LogIn } from "lucide-react";
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
		<div className="w-dvw h-dvh flex items-center-safe justify-center-safe flex-col">
			<Card className="w-md">
				<CardHeader>
					<CardTitle>JetLag Admin Panel</CardTitle>
					<CardDescription>
						Please log in using the admin credentials specified in the environment variables.
					</CardDescription>
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
							className="flex items-center gap-2 ml-auto">
							<LogIn />
							Log In
						</Button>
					</CardFooter>
				</Form>
			</Card>
		</div>
	);
};

export default LoginScreen;
