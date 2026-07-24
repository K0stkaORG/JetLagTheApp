import ConfirmButton from "@/components/ConfirmButton";
import ScreenTemplate from "@/components/ScreenTemplate";
import ValidatedJsonEditor, { ValidatedJsonEditorHandle } from "@/components/ValidatedJsonEditor";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServer } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	AdminCreateDatasetRequest,
	AdminCreateDatasetResponse,
	formatGameType,
	GameTypes,
	getDatasetSchema,
	getDatasetTemplate,
} from "@jetlag/shared-types";
import { AlertCircle, FileJson, Save, Sparkles, TextAlignStart } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const NewDatasetScreen = () => {
	const navigate = useNavigate();

	const form = useForm({
		resolver: zodResolver(AdminCreateDatasetRequest),
		mode: "onChange",
		defaultValues: {
			name: "",
			gameType: GameTypes[0],
			data: {},
		},
	});

	const editorRef = useRef<ValidatedJsonEditorHandle>(null);

	const selectedType = useWatch({ control: form.control, name: "gameType" });
	const schema = useMemo(() => getDatasetSchema(selectedType), [selectedType]);

	const handleGenerateTemplate = () => {
		const type = form.getValues("gameType");
		const template = getDatasetTemplate(type);
		form.setValue("data", template, { shouldValidate: true });
	};

	const handleFormatJson = () => {
		editorRef.current?.format();
		form.trigger("data");
	};

	const onSubmit = useCallback(
		async (data: AdminCreateDatasetRequest) => {
			const response = await useServer<AdminCreateDatasetRequest, AdminCreateDatasetResponse>({
				method: "POST",
				path: "/datasets/create",
				data,
			});

			if (response.result === "success") {
				toast.success("Dataset created successfully");
				navigate("/panel/datasets");
			}
		},
		[navigate],
	);

	return (
		<ScreenTemplate
			title="New Dataset"
			backPath="/panel/datasets"
			scrollable={false}>
			<div className="flex h-full min-h-0 w-full flex-col gap-6 overflow-y-auto pr-1 lg:flex-row lg:overflow-hidden">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex h-full min-h-0 w-full flex-1 flex-col gap-6 lg:flex-row">
						{/* Left Panel: Configuration Fields */}
						<div className="bg-card flex h-fit w-full flex-none flex-col justify-between rounded-xl border p-6 shadow-sm lg:h-full lg:w-80">
							<div className="space-y-6">
								<div>
									<div className="mb-2 flex items-center gap-2">
										<div className="bg-primary/10 text-primary rounded-lg p-2">
											<FileJson className="size-6" />
										</div>
									</div>
									<h2 className="text-xl font-bold">New Dataset</h2>
									<p className="text-muted-foreground text-xs">
										Create a game area configuration or geodata dataset.
									</p>
								</div>

								<div className="space-y-4">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Dataset Name</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder="e.g. Central Park"
														className="bg-background"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="gameType"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Game Type</FormLabel>
												<FormControl>
													<Select
														value={field.value}
														onValueChange={(v) => {
															field.onChange(v);
														}}>
														<SelectTrigger className="bg-background">
															<SelectValue />
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
								</div>
							</div>

							<div className="mt-8 border-t pt-6 lg:mt-0">
								<Button
									type="submit"
									className="flex w-full items-center justify-center gap-2 font-semibold shadow-sm">
									<Save className="size-4" />
									Create Dataset
								</Button>
							</div>
						</div>

						{/* Right Panel: Editor */}
						<div className="bg-card flex min-h-112.5 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm lg:h-full lg:min-h-0">
							<div className="bg-muted/30 flex flex-none flex-col justify-between gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:py-2">
								<div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
									<FileJson className="size-4" />
									JSON Data Editor
								</div>

								{/* Header Actions & Errors */}
								<div className="flex flex-wrap items-center gap-3">
									{form.formState.errors.data?.message && (
										<span className="text-destructive flex max-w-xs animate-pulse items-center gap-1.5 truncate text-xs font-semibold">
											<AlertCircle className="size-3.5 shrink-0" />
											{String(form.formState.errors.data.message)}
										</span>
									)}
									<div className="flex items-center gap-2">
										<ConfirmButton
											variant="outline"
											size="sm"
											onClick={handleGenerateTemplate}
											confirmMessage="This will override any existing configuration">
											<Sparkles className="mr-1.5 size-3.5" />
											Template
										</ConfirmButton>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleFormatJson}>
											<TextAlignStart className="mr-1.5 size-3.5" />
											Format
										</Button>
									</div>
								</div>
							</div>

							<FormField
								control={form.control}
								name="data"
								render={({ field }) => (
									<FormItem className="flex min-h-0 flex-1 flex-col">
										<FormControl>
											<ValidatedJsonEditor
												ref={editorRef}
												value={field.value as object}
												onChange={field.onChange}
												onBlur={field.onBlur}
												zodSchema={schema}
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

export default NewDatasetScreen;
