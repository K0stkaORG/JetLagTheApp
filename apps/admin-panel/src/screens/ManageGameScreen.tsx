import { AdminAddPlayerRequest, AdminGameInfoResponse, AdminRequestWithGameId } from "@jetlag/shared-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudCheck, CloudOff, Info, Pause, Play, UserPlus, Users } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useLoaderData, useRevalidator } from "react-router";

import { Badge } from "@/components/ui/badge";
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
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
				{/* Game Info Column */}
				<div className="lg:col-span-2 space-y-6">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Info className="size-5 text-primary" />
									<CardTitle>Game Status</CardTitle>
								</div>

								{gameInfo.serverLoaded ? (
									<Badge
										variant="default"
										className="bg-green-500/15 text-green-700 border-green-500/20">
										<CloudCheck className="size-3 mr-1" />
										Running
									</Badge>
								) : (
									<Badge
										variant="destructive"
										className="bg-red-500/15 text-red-700 border-red-500/20">
										<CloudOff className="size-3 mr-1" />
										Offline
									</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent className="grid md:grid-cols-2 gap-6">
							<div className="bg-muted/30 p-4 rounded-xl border flex flex-col items-center justify-center text-center">
								<span className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-1">
									Game Time
								</span>
								<GameTime
									{...gameInfo.timeline}
									className="text-4xl font-mono font-bold text-primary"
								/>
							</div>

							<div className="space-y-4">
								<div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
									<span className="text-sm font-medium text-muted-foreground">Phase</span>
									<Badge
										variant="secondary"
										className="capitalize">
										{gameInfo.timeline.phase}
									</Badge>
								</div>

								<div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
									<span className="text-sm font-medium text-muted-foreground">Type</span>
									<span className="text-sm font-semibold capitalize">{gameInfo.type}</span>
								</div>

								<div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
									<span className="text-sm font-medium text-muted-foreground">Last Sync</span>
									<span className="text-sm font-mono">
										{format(new Date(gameInfo.timeline.sync), "HH:mm:ss")}
									</span>
								</div>
							</div>

							<div className="md:col-span-2 flex gap-3 pt-2">
								{gameInfo.timeline.phase === "paused" ? (
									<ConfirmButton
										className="w-full"
										onClick={handleResumeGame}
										confirmMessage="Are you sure you want to resume the game?"
										confirmButtonText="Yes, Resume Game">
										<Play className="size-4 mr-2" />
										Resume Game
									</ConfirmButton>
								) : (
									<ConfirmButton
										variant="secondary"
										className="w-full"
										onClick={handlePauseGame}
										confirmMessage="Are you sure you want to pause the game? Players won't be able to perform actions."
										confirmButtonText="Yes, Pause Game">
										<Pause className="size-4 mr-2" />
										Pause Game
									</ConfirmButton>
								)}
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
									<Users className="size-5 text-primary" />
									<CardTitle>Players</CardTitle>
								</div>
								<Badge variant="secondary">{gameInfo.players.length}</Badge>
							</div>
							<CardDescription>Manage active players</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2 max-h-75 overflow-y-auto pr-2">
								{gameInfo.players.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
										No players joined yet
									</div>
								) : (
									gameInfo.players.map((player) => (
										<div
											key={player.userId}
											className="flex items-center justify-between p-3 rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow">
											<div className="flex items-center gap-3">
												<div
													className="size-3 rounded-full ring-2 ring-offset-2 ring-offset-card"
													style={{
														backgroundColor: player.colors.light,
														boxShadow: `0 0 0 2px ${player.colors.dark}`,
													}}
												/>
												<div>
													<div className="font-semibold text-sm">{player.nickname}</div>
													<div className="text-xs text-muted-foreground font-mono">
														ID: {player.userId}
													</div>
												</div>
											</div>

											{player.isOnline ? (
												<div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
													<div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
													Online
												</div>
											) : (
												<div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
													<div className="size-1.5 rounded-full bg-muted-foreground/50" />
													Offline
												</div>
											)}
										</div>
									))
								)}
							</div>

							<div className="pt-4 border-t">
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
															<UserPlus className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
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
