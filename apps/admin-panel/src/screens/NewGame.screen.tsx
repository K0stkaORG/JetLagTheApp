import ScreenTemplate from "@/components/ScreenTemplate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/datePicker";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateEditorMarkers } from "@/lib/monaco-helpers";
import { useServer } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	AdminCreateGameRequest,
	AdminCreateGameResponse,
	AdminDatasetsListResponse,
	GameType,
	GameTypes,
} from "@jetlag/shared-types";
import Editor from "@monaco-editor/react";
import { CirclePlus, FileJson, Gamepad2, Sparkles, TextAlignStart } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useLoaderData, useNavigate } from "react-router";
import { toast } from "sonner";

const DEFAULT_SETTINGS: Record<GameType, object> = {
	hideAndSeek: {},
	roundabout: { teams: [] },
};

const NewGameScreen = () => {
	const navigate = useNavigate();
	const datasets = useLoaderData<AdminDatasetsListResponse>();

	const form = useForm({
		resolver: zodResolver(AdminCreateGameRequest),
		defaultValues: {
			type: GameTypes[0] as GameType,
			datasetId: undefined as unknown as number,
			startAt: new Date(),
			settings: DEFAULT_SETTINGS[GameTypes[0] as GameType] as unknown as Record<string, never>,
		},
	});

	const [settingsJson, setSettingsJson] = useState(
		JSON.stringify(DEFAULT_SETTINGS[GameTypes[0] as GameType], null, 2),
	);

	const editorRef = useRef<unknown>(null);
	const monacoRef = useRef<unknown>(null);

	useEffect(() => {
		updateEditorMarkers(monacoRef.current, editorRef.current, settingsJson, form.formState.errors.settings);
	}, [settingsJson, form.formState.errors.settings, form]);

	const selectedType = useWatch({ control: form.control, name: "type" }) as GameType;
	const selectedDatasetId = useWatch({ control: form.control, name: "datasetId" });

	const compatibleDatasets = useMemo(
		() => datasets.filter((d) => d.gameType === selectedType),
		[datasets, selectedType],
	);

	const handleTypeChange = useCallback(
		(type: GameType) => {
			form.setValue("type", type);
			form.setValue("datasetId", undefined as unknown as number);
			const defaultSettings = DEFAULT_SETTINGS[type];
			setSettingsJson(JSON.stringify(defaultSettings, null, 2));
			form.setValue("settings", defaultSettings as unknown as Record<string, never>, {
				shouldValidate: true,
			});
		},
		[form],
	);

	const handleSettingsChange = (value: string) => {
		setSettingsJson(value);
		try {
			const parsed = JSON.parse(value);
			if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
				throw new Error("Settings must be a JSON object");
			}
			form.setValue("settings", parsed as unknown as Record<string, never>, {
				shouldValidate: true,
			});
		} catch (e) {
			form.setError("settings", {
				type: "manual",
				message: e instanceof Error ? e.message : "Invalid JSON",
			});
		}
	};

	const handleFormatJson = () => {
		try {
			const formatted = JSON.stringify(JSON.parse(settingsJson), null, 2);
			setSettingsJson(formatted);
			const parsed = JSON.parse(formatted);
			if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
				throw new Error("Settings must be a JSON object");
			}
			form.setValue("settings", parsed as unknown as Record<string, never>, {
				shouldValidate: true,
			});
		} catch (e) {
			form.setError("settings", {
				type: "manual",
				message: e instanceof Error ? e.message : "Invalid JSON",
			});
		}
	};

	const handleResetTemplate = () => {
		const defaultSettings = DEFAULT_SETTINGS[selectedType];
		setSettingsJson(JSON.stringify(defaultSettings, null, 2));
		form.setValue("settings", defaultSettings as unknown as Record<string, never>, {
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
				navigate(`/panel/games/${response.data.id}`);
			} else {
				toast.error("Failed to create game: " + response.error);
			}
		},
		[navigate],
	);

	return (
		<ScreenTemplate
			title="New Game"
			backPath="/panel/games"
			scrollable={false}>
			<div className="flex h-full flex-col space-y-4 pb-4">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex h-full flex-col space-y-4">
						<Card>
							<CardHeader>
								<div className="mb-2 flex items-center gap-2">
									<div className="bg-primary/10 text-primary rounded-lg p-2">
										<Gamepad2 className="size-6" />
									</div>
								</div>
								<CardTitle>Create Game</CardTitle>
								<CardDescription>
									Configure a new game session with dataset and settings.
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-6">
								<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
										name="datasetId"
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
																		? "No datasets available for this mode"
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
													<p className="text-muted-foreground mt-1 text-sm">
														No datasets available for {selectedType}.{" "}
														<Link
															to="/panel/datasets/new"
															className="text-primary underline">
															Import a dataset
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
												<FormLabel>Scheduled Start Time</FormLabel>
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
							</CardContent>
						</Card>

						<div className="bg-card flex min-h-125 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
							<div className="bg-muted/30 flex items-center justify-between border-b px-4 py-2">
								<div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
									<FileJson className="size-4" />
									JSON Editor
								</div>
								<div className="flex items-center gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleResetTemplate}>
										<Sparkles className="mr-2 size-4" />
										Reset to Default
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleFormatJson}>
										<TextAlignStart className="mr-2 size-4" />
										Format
									</Button>
								</div>
							</div>
							<div className="relative flex-1">
								<Editor
									height="100%"
									defaultLanguage="json"
									value={settingsJson}
									onChange={(value) => handleSettingsChange(value ?? "")}
									theme="vs-dark"
									onMount={(editor, monaco) => {
										editorRef.current = editor;
										monacoRef.current = monaco;
										updateEditorMarkers(
											monaco,
											editor,
											settingsJson,
											form.formState.errors.settings,
										);
									}}
									options={{
										minimap: { enabled: false },
										automaticLayout: true,
										fontSize: 14,
										fontFamily: "monospace",
										scrollBeyondLastLine: false,
									}}
								/>
							</div>
							{form.formState.errors.settings && (
								<p className="text-destructive px-4 py-2 text-sm font-medium">
									{String(form.formState.errors.settings.message)}
								</p>
							)}
						</div>

						<div className="flex justify-end pt-2">
							<Button
								type="submit"
								size="lg"
								disabled={form.formState.isSubmitting || !selectedDatasetId}
								className="flex items-center gap-2 font-semibold shadow-sm">
								<CirclePlus className="size-5" />
								{form.formState.isSubmitting ? "Creating..." : "Create Game Session"}
							</Button>
						</div>
					</form>
				</Form>
			</div>
		</ScreenTemplate>
	);
};

export default NewGameScreen;
