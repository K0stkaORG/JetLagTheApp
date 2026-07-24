import ScreenTemplate from "@/components/ScreenTemplate";
import ValidatedJsonEditor, { ValidatedJsonEditorHandle } from "@/components/ValidatedJsonEditor";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/datePicker";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServer } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	AdminCreateGameRequest,
	AdminCreateGameResponse,
	AdminDatasetsListResponse,
	formatGameType,
	GameType,
	GameTypes,
	getGameSettingsSchema,
	getGameSettingsTemplate,
} from "@jetlag/shared-types";
import { AlertCircle, CirclePlus, FileJson, Gamepad2, Sparkles, TextAlignStart } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useLoaderData, useNavigate } from "react-router";
import { toast } from "sonner";

const getDefaultStartAt = () => {
	const date = new Date();
	date.setSeconds(0, 0);
	date.setMinutes(date.getMinutes() + 5);
	return date;
};

const NewGameScreen = () => {
	const navigate = useNavigate();
	const datasets = useLoaderData<AdminDatasetsListResponse>();

	const form = useForm({
		resolver: zodResolver(AdminCreateGameRequest),
		mode: "onChange",
		defaultValues: {
			type: GameTypes[0],
			datasetMetadataId: undefined,
			startAt: getDefaultStartAt(),
			settings: getGameSettingsTemplate(GameTypes[0]),
		},
	});

	const editorRef = useRef<ValidatedJsonEditorHandle>(null);

	const selectedType = useWatch({ control: form.control, name: "type" }) as GameType;
	const selectedDatasetId = useWatch({ control: form.control, name: "datasetMetadataId" });

	const compatibleDatasets = useMemo(
		() => datasets.filter((d) => d.gameType === selectedType),
		[datasets, selectedType],
	);

	const settingsSchema = useMemo(() => getGameSettingsSchema(selectedType), [selectedType]);

	const handleTypeChange = useCallback(
		(type: GameType) => {
			form.setValue("type", type);
			form.setValue("datasetMetadataId", undefined as unknown as number);
			form.setValue("settings", getGameSettingsTemplate(type), {
				shouldValidate: true,
			});
		},
		[form],
	);

	const handleResetTemplate = () => {
		form.setValue("settings", getGameSettingsTemplate(selectedType) as unknown as Record<string, never>, {
			shouldValidate: true,
		});
	};

	const onSubmit = useCallback(
		async (data: AdminCreateGameRequest) => {
			const response = await useServer<AdminCreateGameRequest, AdminCreateGameResponse>({
				path: "/games/create",
				data,
			});

			if (response.result === "success") {
				toast.success("Game session created successfully");
				navigate(`/panel/games/${response.data.id}`);
			}
		},
		[navigate],
	);

	return (
		<ScreenTemplate
			title="New Game"
			backPath="/panel/games"
			scrollable={false}>
			<div className="flex h-full min-h-0 w-full flex-col gap-6 overflow-y-auto pr-1 lg:flex-row lg:overflow-hidden">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex h-full min-h-0 w-full flex-1 flex-col gap-6 lg:flex-row">
						{/* Left Panel: Settings */}
						<div className="bg-card flex h-fit w-full flex-none flex-col justify-between rounded-xl border p-6 shadow-sm lg:h-full lg:w-80">
							<div className="space-y-6">
								<div>
									<div className="mb-2 flex items-center gap-2">
										<div className="bg-primary/10 text-primary rounded-lg p-2">
											<Gamepad2 className="size-6" />
										</div>
									</div>
									<h2 className="text-xl font-bold">Create Game</h2>
									<p className="text-muted-foreground text-xs">
										Configure a new game session with dataset and settings.
									</p>
								</div>

								<div className="space-y-4">
									<FormField
										control={form.control}
										name="type"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Game Mode</FormLabel>
												<FormControl>
													<Select
														value={field.value}
														onValueChange={(v) => handleTypeChange(v as GameType)}>
														<SelectTrigger className="bg-background">
															<SelectValue placeholder="Select type" />
														</SelectTrigger>
														<SelectContent>
															{GameTypes.map((type) => (
																<SelectItem
																	key={type}
																	value={type}
																	className="capitalize">
																	{formatGameType(type)}
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
										name="datasetMetadataId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Dataset</FormLabel>
												<FormControl>
													<Select
														value={
															field.value !== undefined
																? field.value.toString()
																: undefined
														}
														onValueChange={(v) => field.onChange(Number(v))}
														disabled={compatibleDatasets.length === 0}>
														<SelectTrigger className="bg-background">
															<SelectValue
																placeholder={
																	compatibleDatasets.length === 0
																		? "No datasets available"
																		: "Select dataset"
																}
															/>
														</SelectTrigger>
														<SelectContent>
															{compatibleDatasets.map((dataset) => (
																<SelectItem
																	key={dataset.id}
																	value={dataset.id.toString()}>
																	{dataset.name} (v.{dataset.lastVersion})
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</FormControl>
												{compatibleDatasets.length === 0 && (
													<p className="text-muted-foreground mt-1 text-[11px] leading-tight">
														No datasets available for {selectedType}.{" "}
														<Link
															to="/panel/datasets/new"
															className="text-primary underline">
															Import dataset
														</Link>
													</p>
												)}
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="startAt"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Start Time</FormLabel>
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
								</div>
							</div>

							<div className="mt-8 border-t pt-6 lg:mt-0">
								<Button
									type="submit"
									disabled={form.formState.isSubmitting || !selectedDatasetId}
									className="flex w-full items-center justify-center gap-2 font-semibold shadow-sm">
									<CirclePlus className="size-5" />
									{form.formState.isSubmitting ? "Creating..." : "Create Game Session"}
								</Button>
							</div>
						</div>

						{/* Right Panel: Editor */}
						<div className="bg-card flex min-h-112.5 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm lg:h-full lg:min-h-0">
							<div className="bg-muted/30 flex flex-none flex-col justify-between gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:py-2">
								<div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
									<FileJson className="size-4" />
									JSON Settings Editor
								</div>

								{/* Header Actions & Errors */}
								<div className="flex flex-wrap items-center gap-3">
									{form.formState.errors.settings?.message && (
										<span className="text-destructive flex max-w-xs animate-pulse items-center gap-1.5 truncate text-xs font-semibold">
											<AlertCircle className="size-3.5 shrink-0" />
											{String(form.formState.errors.settings.message)}
										</span>
									)}
									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleResetTemplate}>
											<Sparkles className="mr-1.5 size-3.5" />
											Reset
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => editorRef.current?.format()}>
											<TextAlignStart className="mr-1.5 size-3.5" />
											Format
										</Button>
									</div>
								</div>
							</div>

							<FormField
								control={form.control}
								name="settings"
								render={({ field }) => (
									<FormItem className="flex min-h-0 flex-1 flex-col">
										<FormControl>
											<ValidatedJsonEditor
												ref={editorRef}
												value={field.value as object}
												onChange={field.onChange}
												onBlur={field.onBlur}
												zodSchema={settingsSchema}
												className="flex-1 rounded-none border-0"
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
					</form>
				</Form>
			</div>
		</ScreenTemplate>
	);
};

export default NewGameScreen;
