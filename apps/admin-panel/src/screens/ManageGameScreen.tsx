import { AdminAddPlayerRequest, AdminGameInfoResponse, AdminRequestWithGameId } from "@jetlag/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CloudOff, Pause, Play } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useLoaderData, useRevalidator } from "react-router";

import { Button } from "@/components/ui/button";
import ConfirmButton from "@/components/ConfirmButton";
import GameTime from "@/components/GameTime";
import { Input } from "@/components/ui/input";
import ScreenTemplate from "@/components/ScreenTemplate";
import { format } from "date-fns";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useServer } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";

const ManageGameScreen = () => {
	const gameInfo = useLoaderData<AdminGameInfoResponse>();
	const revalidator = useRevalidator();

	const form = useForm({
		resolver: zodResolver(AdminAddPlayerRequest),
		defaultValues: {
			gameId: gameInfo.id,
			userId: "" as unknown as number,
		},
	});

	const handlePauseGame = useCallback(() => {
		useServer<AdminRequestWithGameId, void>({
			path: "/games/pause",
			data: { gameId: gameInfo.id },
			showPendingToast: true,
			onSuccess: revalidator.revalidate,
			voidResponse: true,
		});
	}, [gameInfo.id, revalidator]);

	const handleResumeGame = useCallback(() => {
		useServer<AdminRequestWithGameId, void>({
			path: "/games/resume",
			data: { gameId: gameInfo.id },
			showPendingToast: true,
			onSuccess: revalidator.revalidate,
			voidResponse: true,
		});
	}, [gameInfo.id, revalidator]);

	const handleAddPlayer = useCallback(
		async (data: AdminAddPlayerRequest) => {
			useServer<AdminAddPlayerRequest, void>({
				path: "/games/add-player",
				data,
				onSuccess: () => {
					form.reset();
					revalidator.revalidate();
				},
				voidResponse: true,
			});
		},
		[form, revalidator],
	);

	return (
		<ScreenTemplate
			title={`Game #${gameInfo.id}`}
			backPath="/panel/games">
			<div className="grid gap-3">
				{/* Game Info Card */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Game Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						{/* Game Details Grid */}
						<div className="grid grid-cols-3 gap-2">
							<div>
								<p className="text-xs text-muted-foreground">Type</p>
								<p className="font-medium capitalize">{gameInfo.type}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Phase</p>
								<p className="font-medium capitalize">{gameInfo.timeline.phase}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Time</p>
								<p className="font-medium">
									<GameTime {...gameInfo.timeline} />
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Server</p>
								<p className="font-medium">
									{gameInfo.serverLoaded ? (
										<span className="flex items-center gap-1 text-green-600">
											<Cloud className="size-3" /> Loaded
										</span>
									) : (
										<span className="flex items-center gap-1 text-yellow-600">
											<CloudOff className="size-3" /> Off
										</span>
									)}
								</p>
							</div>
							<div className="col-span-2">
								<p className="text-xs text-muted-foreground">Last Sync</p>
								<p className="font-medium">{format(new Date(gameInfo.timeline.sync), "HH:mm:ss")}</p>
							</div>
						</div>

						{/* Game Controls */}
						<div className="flex gap-2 pt-2">
							{gameInfo.timeline.phase === "paused" ? (
								<ConfirmButton
									variant="default"
									size="sm"
									onClick={handleResumeGame}
									confirmMessage="Resume this game?"
									confirmButtonText="Resume">
									<Play className="size-3" />
									Resume
								</ConfirmButton>
							) : (
								<ConfirmButton
									variant="outline"
									size="sm"
									onClick={handlePauseGame}
									confirmMessage="Pause this game?"
									confirmButtonText="Pause">
									<Pause className="size-3" />
									Pause
								</ConfirmButton>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Players Card */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Players ({gameInfo.players.length})</CardTitle>
					</CardHeader>
					<CardContent>
						{gameInfo.players.length === 0 ? (
							<p className="text-xs text-muted-foreground">No players</p>
						) : (
							<div className="space-y-1">
								{gameInfo.players.map((player) => (
									<div
										key={player.userId}
										className="flex items-center justify-between rounded border p-2 text-xs">
										<div className="flex items-center gap-2">
											<div
												className="size-2 rounded-full"
												style={{
													backgroundColor: player.colors.light,
												}}
											/>
											<span className="font-medium">{player.nickname}</span>
											<span className="text-muted-foreground">#{player.userId}</span>
										</div>
										<div
											className={`flex items-center gap-0.5 ${
												player.isOnline ? "text-green-600" : "text-muted-foreground"
											}`}>
											{player.isOnline ? (
												<>
													<Cloud className="size-2.5" />
													<span>Online</span>
												</>
											) : (
												<>
													<CloudOff className="size-2.5" />
													<span>Offline</span>
												</>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Add Player Card */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Add Player</CardTitle>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(handleAddPlayer)}
								className="flex gap-2">
								<FormField
									control={form.control}
									name="userId"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormControl>
												<Input
													type="number"
													placeholder="User ID..."
													{...field}
													onChange={(e) =>
														field.onChange(e.target.value ? parseInt(e.target.value) : "")
													}
													className="h-8 text-xs"
													min="1"
												/>
											</FormControl>
											<FormMessage className="text-xs" />
										</FormItem>
									)}
								/>
								<Button
									type="submit"
									size="sm"
									className="text-xs"
									disabled={form.formState.isSubmitting}>
									{form.formState.isSubmitting ? "Adding..." : "Add"}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</ScreenTemplate>
	);
};

export default ManageGameScreen;
