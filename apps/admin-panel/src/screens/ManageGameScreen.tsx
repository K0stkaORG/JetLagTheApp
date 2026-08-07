import ConfirmButton from "@/components/ConfirmButton";
import { GameStatePreview } from "@/components/GameStatePreview";
import GameTime from "@/components/GameTime";
import ScreenTemplate from "@/components/ScreenTemplate";
import StatusBadge, { LiveDot } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServer } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	AdminAddPlayerRequest,
	AdminGameInfoResponse,
	AdminRequestWithGameId,
	AdminUsersListResponse,
	formatGameType,
} from "@jetlag/shared-types";
import { AlertTriangle, Cog, MapPinHouse, OctagonX, Pause, Play, Trash2, UserPlus, Users } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useLoaderData, useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";

const ManageGameScreen = () => {
	const navigate = useNavigate();
	const revalidator = useRevalidator();
	const { gameInfo, users } = useLoaderData<{ gameInfo: AdminGameInfoResponse; users: AdminUsersListResponse }>();

	const form = useForm({
		resolver: zodResolver(AdminAddPlayerRequest),
		defaultValues: {
			gameId: gameInfo.id,
			userId: undefined as unknown as number,
		},
	});

	const availableUsersToAdd = useMemo(() => {
		const existingUserIds = new Set(gameInfo.players.map((p) => p.userId));
		return users.filter((u) => !existingUserIds.has(u.id));
	}, [users, gameInfo.players]);

	const handlePauseGame = useCallback(() => {
		useServer<AdminRequestWithGameId, void>({
			path: "/games/pause",
			data: { gameId: gameInfo.id },
			showPendingToast: true,
			onSuccess: () => {
				toast.success("Game paused");
				revalidator.revalidate();
			},
			voidResponse: true,
		});
	}, [gameInfo.id, revalidator]);

	const handleResumeGame = useCallback(() => {
		useServer<AdminRequestWithGameId, void>({
			path: "/games/resume",
			data: { gameId: gameInfo.id },
			showPendingToast: true,
			onSuccess: () => {
				toast.success("Game resumed");
				revalidator.revalidate();
			},
			voidResponse: true,
		});
	}, [gameInfo.id, revalidator]);

	const handleEndGame = useCallback(() => {
		useServer<AdminRequestWithGameId, void>({
			path: "/games/end",
			data: { gameId: gameInfo.id },
			showPendingToast: true,
			onSuccess: () => {
				toast.success("Game ended");
				revalidator.revalidate();
			},
			voidResponse: true,
		});
	}, [gameInfo.id, revalidator]);

	const handleDeleteGame = useCallback(async () => {
		const response = await useServer<AdminRequestWithGameId, void>({
			path: "/games/delete",
			data: { gameId: gameInfo.id },
			showPendingToast: true,
			voidResponse: true,
		});

		if (response.result === "success") {
			toast.success(`Game #${gameInfo.id} deleted`);
			navigate("/panel/games");
		}
	}, [gameInfo.id, navigate]);

	const handleAddPlayer = useCallback(
		async (data: AdminAddPlayerRequest) => {
			const res = await useServer<AdminAddPlayerRequest, void>({
				path: "/games/add-player",
				data,
				onSuccess: () => {
					form.reset({ gameId: gameInfo.id, userId: undefined as unknown as number });
					toast.success("Player added to game");
					revalidator.revalidate();
				},
				voidResponse: true,
			});

			if (res.result === "success") {
				form.reset({ gameId: gameInfo.id, userId: undefined as unknown as number });
			}
		},
		[form, gameInfo.id, revalidator],
	);

	const titleText = `${formatGameType(gameInfo.type)}${gameInfo.dataset?.name ? `: ${gameInfo.dataset.name}` : ""}`;
	const subtitleText = `Game #${gameInfo.id}${gameInfo.dataset?.version !== undefined ? ` • Dataset v.${gameInfo.dataset.version}` : ""}`;

	return (
		<ScreenTemplate
			title={titleText}
			backPath="/panel/games">
			<div className="mx-auto w-full max-w-5xl space-y-8 pb-24">
				<div className="from-card via-card to-muted/30 flex flex-col gap-3 rounded-2xl border bg-linear-to-br p-6 shadow-xs">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<h2 className="text-2xl font-extrabold tracking-tight md:text-4xl">{titleText}</h2>
							<p className="text-muted-foreground font-mono text-xs">{subtitleText}</p>
						</div>
						<img
							src="/logo.svg"
							alt="JetLag"
							className="hidden size-14 md:block"
						/>
					</div>

					{/* Flat Stats Line (Last sync removed) */}
					<div className="flex flex-col gap-4 border-t pt-4 md:flex-row">
						<div className="flex flex-1 items-center justify-between gap-2 md:block md:text-center">
							<div className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
								Server state
							</div>
							<StatusBadge
								variant={gameInfo.serverLoaded ? "running" : "offline"}
								className="relative md:top-1"
							/>
						</div>

						<div className="border-muted flex flex-1 items-center justify-between gap-2 md:block md:border-x-2 md:px-4 md:text-center">
							<div className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
								Game Time
							</div>
							<GameTime
								{...gameInfo.timeline}
								className="text-primary mt-0.5 font-mono text-xl font-black"
							/>
						</div>

						<div className="flex flex-1 items-center justify-between gap-2 md:block md:text-center">
							<div className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
								Timeline Phase
							</div>
							<div className="text-foreground mt-0.5 text-base font-bold capitalize">
								{gameInfo.timeline.phase}
							</div>
						</div>
					</div>
				</div>

				{/* Section: Players */}
				<section className="space-y-3">
					<div className="flex items-center justify-between border-b pb-2">
						<div className="flex items-center gap-2">
							<Users className="text-primary size-4" />
							<h3 className="text-lg font-bold"> Players</h3>
						</div>
						<span className="text-muted-foreground text-xs font-medium">
							{gameInfo.players.length} players
						</span>
					</div>

					<div className="bg-card space-y-4 rounded-xl border p-5">
						{/* Compact Players List (No User IDs) */}
						{gameInfo.players.length === 0 ? (
							<div className="text-muted-foreground rounded-lg border-2 border-dashed py-6 text-center text-xs">
								No players assigned yet.
							</div>
						) : (
							<div className="flex flex-wrap gap-2">
								{gameInfo.players.map((player) => (
									<div
										key={player.userId}
										className="bg-muted/20 flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-medium">
										<div
											className="size-2.5 shrink-0 rounded-full"
											style={{
												backgroundColor: player.colors.light,
												boxShadow: `0 0 0 1.5px ${player.colors.dark}`,
											}}
										/>
										<span>{player.nickname}</span>
										{player.isOnline && <LiveDot />}
									</div>
								))}
							</div>
						)}
						{availableUsersToAdd.length > 0 && (
							<div className="flex items-center justify-between gap-2 border-t pt-3">
								<div className="text-muted-foreground hidden w-full items-center gap-1.5 text-xs font-semibold md:flex">
									<UserPlus className="text-primary size-3.5" />
									Add Player
								</div>

								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(handleAddPlayer)}
										className="flex w-full items-end gap-2 md:w-auto">
										<FormField
											control={form.control}
											name="userId"
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormControl>
														<Select
															value={
																field.value !== undefined ? field.value.toString() : ""
															}
															onValueChange={(val) => field.onChange(Number(val))}
															disabled={availableUsersToAdd.length === 0}>
															<SelectTrigger className="bg-background h-9 w-full text-xs md:w-60">
																<SelectValue
																	placeholder={
																		availableUsersToAdd.length === 0
																			? "All registered users added"
																			: "Select player..."
																	}
																/>
															</SelectTrigger>
															<SelectContent>
																{availableUsersToAdd.map((u) => (
																	<SelectItem
																		key={u.id}
																		value={u.id.toString()}>
																		<div className="flex items-center gap-2 text-xs">
																			<div
																				className="ml-1 size-2 rounded-full"
																				style={{
																					backgroundColor: u.colors.light,
																					boxShadow: `0 0 0 1px ${u.colors.dark}`,
																				}}
																			/>
																			<span>{u.nickname}</span>
																		</div>
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<Button
											type="submit"
											disabled={form.formState.isSubmitting || !form.watch("userId")}
											variant="secondary"
											size="sm"
											className="h-9 shrink-0 font-medium">
											{form.formState.isSubmitting ? "Adding..." : "Add Player"}
										</Button>
									</form>
								</Form>
							</div>
						)}
					</div>
				</section>

				{/* Section: Settings (Code block, not editor) */}
				<section className="space-y-3">
					<div className="flex items-center justify-between border-b pb-2">
						<div className="flex items-center gap-2">
							<Cog className="text-primary size-4" />
							<h3 className="text-lg font-bold">Game Settings</h3>
						</div>
					</div>

					<div className="bg-card overflow-hidden rounded-xl border shadow-xs">
						<pre className="bg-muted/10 text-foreground max-h-72 overflow-x-auto p-4 font-mono text-xs leading-relaxed">
							{JSON.stringify(gameInfo.settings || {}, null, 2)}
						</pre>
					</div>
				</section>

				{/* Section: State (Per-property hiding) */}
				<section className="space-y-3">
					<div className="flex items-center justify-between border-b pb-2">
						<div className="flex items-center gap-2">
							<MapPinHouse className="text-primary size-4" />
							<h3 className="text-lg font-bold">Game State</h3>
						</div>
					</div>

					<div className="bg-card max-h-125 overflow-auto rounded-xl border p-4 font-mono text-xs shadow-xs">
						<GameStatePreview state={gameInfo.state || {}} />
					</div>
				</section>

				{/* Section: Danger Zone (Contains End Game and Delete Game) */}
				<section className="space-y-3 border-t pt-4">
					<div className="text-destructive flex items-center gap-2">
						<AlertTriangle className="size-4" />
						<h3 className="text-lg font-bold">Danger Zone</h3>
					</div>

					<div className="border-destructive/30 bg-destructive/5 space-y-4 rounded-xl border p-5">
						<div className="border-destructive/20 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
							{gameInfo.timeline.phase === "paused" ? (
								<>
									<div>
										<h4 className="text-foreground text-xs font-bold">Resume game</h4>
										<p className="text-muted-foreground text-[11px]">
											Immediately resume the game from its paused state.
										</p>
									</div>

									<ConfirmButton
										variant="destructive"
										size="sm"
										onClick={handleResumeGame}
										confirmMessage="Are you sure you want to resume the game? Make sure all players are ready before doing this."
										confirmButtonText="Yes, Resume Game">
										<Play className="mr-2 size-4" />
										Resume Game
									</ConfirmButton>
								</>
							) : (
								<>
									<div>
										<h4 className="text-foreground text-xs font-bold">Pause game</h4>
										<p className="text-muted-foreground text-[11px]">
											All game logic, timers, effects etc. will be paused
										</p>
									</div>

									<ConfirmButton
										variant="destructive"
										size="sm"
										onClick={handlePauseGame}
										confirmMessage="Are you sure you want to pause the game?"
										confirmButtonText="Yes, Pause Game">
										<Pause className="mr-2 size-4" />
										Pause Game
									</ConfirmButton>
								</>
							)}
						</div>

						{/* End Game Action */}
						<div className="border-destructive/20 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h4 className="text-foreground text-xs font-bold">End Game </h4>
								<p className="text-muted-foreground text-[11px]">
									Stop all game logic, timers, etc. save current state. You won't be able to resume
									the game after this action.
								</p>
							</div>

							<ConfirmButton
								variant="destructive"
								size="sm"
								onClick={handleEndGame}
								confirmMessage="Are you sure you want to end this game? This action cannot be undone."
								confirmButtonText="Yes, End Game">
								<OctagonX className="mr-1.5 size-3.5" />
								End Game
							</ConfirmButton>
						</div>

						{/* Delete Game Action */}
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h4 className="text-foreground text-xs font-bold">Delete Game</h4>
								<p className="text-muted-foreground text-[11px]">
									Permanently remove game #{gameInfo.id} and all its data from the database.
								</p>
							</div>

							<ConfirmButton
								variant="destructive"
								size="sm"
								onClick={handleDeleteGame}
								confirmTitle={`Delete Game #${gameInfo.id}?`}
								confirmMessage="Are you sure you want to permanently delete this game? This action cannot be undone and all game data will be lost."
								confirmButtonText="Permanently Delete Game">
								<Trash2 className="mr-1.5 size-3.5" />
								Delete Game
							</ConfirmButton>
						</div>
					</div>
				</section>
			</div>
		</ScreenTemplate>
	);
};

export default ManageGameScreen;
