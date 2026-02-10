import { AdminCreateGameRequest, AdminCreateGameResponse, GameTypes } from "@jetlag/shared-types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { CirclePlus, Gamepad2 } from "lucide-react";
import { DatePicker } from "@/components/ui/datePicker";
import ScreenTemplate from "@/components/ScreenTemplate";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useServer } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NewGameScreen = () => {
	const navigate = useNavigate();

	const form = useForm({
		resolver: zodResolver(AdminCreateGameRequest),
		defaultValues: {
			type: GameTypes[0],
			startAt: new Date(),
		},
	});

	const onSubmit = useCallback(async (data: AdminCreateGameRequest) => {
		const response = await useServer<AdminCreateGameRequest, AdminCreateGameResponse>({
			path: "/games/create",
			data,
		});

		if (response.result === "success") navigate(`/panel/games/${response.data.id}`);
	}, []);

	return (
		<ScreenTemplate
			title="New Game"
			backPath="/panel/games">
			<div className="max-w-xl mx-auto">
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2 mb-2">
							<div className="p-2 bg-primary/10 rounded-lg text-primary">
								<Gamepad2 className="size-6" />
							</div>
						</div>
						<CardTitle>Create Game</CardTitle>
						<CardDescription>Configure the basic settings for a new game session.</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-6">
								<FormField
									control={form.control}
									name="type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Game Mode</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={field.onChange}>
													<SelectTrigger className="bg-background">
														<SelectValue placeholder="Select type" />
													</SelectTrigger>
													<SelectContent>
														{GameTypes.map((type) => (
															<SelectItem
																key={type}
																value={type}
																className="capitalize">
																{type}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="startAt"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Scheduled Start Time</FormLabel>
											<FormControl>
												<div className="relative">
													<DatePicker
														value={field.value as Date}
														onChange={field.onChange}
													/>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="pt-2">
									<Button
										type="submit"
										className="w-full flex items-center gap-2"
										size="lg">
										<CirclePlus className="size-5" />
										Create Game Session
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</ScreenTemplate>
	);
};

export default NewGameScreen;
