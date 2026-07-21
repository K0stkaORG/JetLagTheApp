import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { AdminAddPlayerRequest, AdminGameInfoResponse, AdminRequestWithGameId } from "@jetlag/shared-types";
import { CloudCheck, CloudOff, Info, OctagonX, Pause, Play, UserPlus, Users } from "lucide-react";
import { useLoaderData, useRevalidator } from "react-router";

import ConfirmButton from "@/components/ConfirmButton";
import GameTime from "@/components/GameTime";
import ScreenTemplate from "@/components/ScreenTemplate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServer } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

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

	const handleEndGame = useCallback(() => {
		useServer<AdminRequestWithGameId, void>({
			path: "/games/end",
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
			<div className="grid grid-cols-1 gap-6 pb-20 lg:grid-cols-3">
				{/* Game Info Column */}
				<div className="space-y-6 lg:col-span-2">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Info className="text-primary size-5" />
									<CardTitle>Game Status</CardTitle>
								</div>

								{gameInfo.serverLoaded ? (
									<Badge
										variant="default"
										className="border-green-500/20 bg-green-500/15 text-green-700">
										<CloudCheck className="mr-1 size-3" />
										Running
									</Badge>
								) : (
									<Badge
										variant="destructive"
										className="border-red-500/20 bg-red-500/15 text-red-700">
										<CloudOff className="mr-1 size-3" />
										Offline
									</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent className="grid gap-6 md:grid-cols-2">
							<div className="bg-muted/30 flex flex-col items-center justify-center rounded-xl border p-4 text-center">
								<span className="text-muted-foreground mb-1 text-sm font-bold tracking-wider uppercase">
									Game Time
								</span>
								<GameTime
									{...gameInfo.timeline}
									className="text-primary font-mono text-4xl font-bold"
								/>
							</div>

							<div className="space-y-4">
								<div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
									<span className="text-muted-foreground text-sm font-medium">Phase</span>
									<Badge
										variant="secondary"
										className="capitalize">
										{gameInfo.timeline.phase}
									</Badge>
								</div>

								<div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
									<span className="text-muted-foreground text-sm font-medium">Type</span>
									<span className="text-sm font-semibold capitalize">{gameInfo.type}</span>
								</div>

								<div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
									<span className="text-muted-foreground text-sm font-medium">Last Sync</span>
									<span className="font-mono text-sm">
										{format(new Date(gameInfo.timeline.sync), "HH:mm:ss")}
									</span>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3 pt-2 md:col-span-2">
								{gameInfo.timeline.phase === "paused" ? (
									<ConfirmButton
										className="w-full"
										onClick={handleResumeGame}
										confirmMessage="Are you sure you want to resume the game?"
										confirmButtonText="Yes, Resume Game">
										<Play className="mr-2 size-4" />
										Resume Game
									</ConfirmButton>
								) : (
									<ConfirmButton
										variant="secondary"
										className="w-full"
										onClick={handlePauseGame}
										confirmMessage="Are you sure you want to pause the game? Players won't be able to perform actions."
										confirmButtonText="Yes, Pause Game">
										<Pause className="mr-2 size-4" />
										Pause Game
									</ConfirmButton>
								)}
								<ConfirmButton
									variant="destructive"
									className="w-full"
									onClick={handleEndGame}
									confirmMessage="Are you sure you want to end the game?"
									confirmButtonText="Yes, End Game">
									<OctagonX className="mr-2 size-4" />
									End Game
								</ConfirmButton>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Players Column */}
				<div className="space-y-6">
					<Card className="h-full">
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Users className="text-primary size-5" />
									<CardTitle>Players</CardTitle>
								</div>
								<Badge variant="secondary">{gameInfo.players.length}</Badge>
							</div>
							<CardDescription>Manage active players</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="max-h-75 space-y-2 overflow-y-auto pr-2">
								{gameInfo.players.length === 0 ? (
									<div className="text-muted-foreground rounded-lg border-2 border-dashed py-8 text-center text-sm">
										No players joined yet
									</div>
								) : (
									gameInfo.players.map((player) => (
										<div
											key={player.userId}
											className="bg-card flex items-center justify-between rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md">
											<div className="flex items-center gap-3">
												<div
													className="ring-offset-card size-3 rounded-full ring-2 ring-offset-2"
													style={{
														backgroundColor: player.colors.light,
														boxShadow: `0 0 0 2px ${player.colors.dark}`,
													}}
												/>
												<div>
													<div className="text-sm font-semibold">{player.nickname}</div>
													<div className="text-muted-foreground font-mono text-xs">
														ID: {player.userId}
													</div>
												</div>
											</div>

											{player.isOnline ? (
												<div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600">
													<div className="size-1.5 animate-pulse rounded-full bg-green-500" />
													Online
												</div>
											) : (
												<div className="text-muted-foreground bg-muted flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium">
													<div className="bg-muted-foreground/50 size-1.5 rounded-full" />
													Offline
												</div>
											)}
										</div>
									))
								)}
							</div>

							<div className="border-t pt-4">
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(handleAddPlayer)}
										className="flex flex-col gap-3">
										<FormField
											control={form.control}
											name="userId"
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<div className="relative">
															<UserPlus className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
															<Input
																type="number"
																placeholder="Enter User ID to add..."
																{...field}
																onChange={(e) =>
																	field.onChange(
																		e.target.value ? parseInt(e.target.value) : "",
																	)
																}
																className="pl-9"
																min="1"
															/>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button
											type="submit"
											disabled={form.formState.isSubmitting}
											variant="secondary"
											className="w-full">
											{form.formState.isSubmitting ? "Adding Player..." : "Add Player"}
										</Button>
									</form>
								</Form>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default ManageGameScreen;
