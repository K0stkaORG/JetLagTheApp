import { AdminCreateGameRequest, AdminCreateGameResponse, GameTypes } from "@jetlag/shared-types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { DatePicker } from "@/components/ui/datePicker";
import ScreenTemplate from "@/components/ScreenTemplate";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useServer } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";

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
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-4">
					<FormField
						control={form.control}
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Type</FormLabel>
								<FormControl>
									<Select
										value={field.value}
										onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											{GameTypes.map((type) => (
												<SelectItem
													key={type}
													value={type}>
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
								<FormLabel>Start At</FormLabel>
								<FormControl>
									<DatePicker
										value={field.value as Date}
										onChange={field.onChange}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="mt-4">
						<Button
							type="submit"
							className="flex items-center gap-2">
							<CirclePlus />
							Create Game
						</Button>
					</div>
				</form>
			</Form>
		</ScreenTemplate>
	);
};

export default NewGameScreen;
