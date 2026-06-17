import ConfirmButton from "@/components/ConfirmButton";
import ScreenTemplate from "@/components/ScreenTemplate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateEditorMarkers } from "@/lib/monaco-helpers";
import { useServer } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	AdminCreateDatasetRequest,
	AdminCreateDatasetResponse,
	GameType,
	GameTypes,
	getDatasetTemplate,
} from "@jetlag/shared-types";
import { formatConfigJSON, stringifyConfigJSON } from "@jetlag/shared-types/src/models/helpers";
import Editor from "@monaco-editor/react";
import { FileJson, Save, Sparkles, TextAlignStart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const NewDatasetScreen = () => {
	const navigate = useNavigate();

	const form = useForm({
		resolver: zodResolver(AdminCreateDatasetRequest),
		defaultValues: {
			name: "",
			gameType: GameTypes[0] as GameType,
			data: undefined as unknown as object,
		},
	});

	const [jsonContent, setJsonContent] = useState<string>("{\n\t\n}");

	const editorRef = useRef<unknown>(null);
	const monacoRef = useRef<unknown>(null);

	useEffect(() => {
		updateEditorMarkers(monacoRef.current, editorRef.current, jsonContent, form.formState.errors.data);
	}, [jsonContent, form.formState.errors.data, form]);

	const handleGenerateTemplate = () => {
		const type = form.getValues("gameType");
		const template = getDatasetTemplate(type);
		const str = stringifyConfigJSON(template);
		setJsonContent(str);
		form.setValue("data", template, { shouldValidate: true });
	};

	const handleFormatJson = () => {
		try {
			const formatted = formatConfigJSON(jsonContent);
			setJsonContent(formatted);
			const parsed = JSON.parse(formatted);
			if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
				throw new Error("Data must be a JSON object");
			}
			form.setValue("data", parsed, { shouldValidate: true });
		} catch (e) {
			form.setError("data", {
				type: "manual",
				message: e instanceof Error ? e.message : "Invalid JSON",
			});
		}
	};

	const handleEditorChange = (value: string | undefined) => {
		setJsonContent(value ?? "");
		try {
			const parsed = JSON.parse(value ?? "");
			if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
				throw new Error("Data must be a JSON object");
			}
			form.setValue("data", parsed, { shouldValidate: true });
		} catch (e) {
			form.setError("data", {
				type: "manual",
				message: e instanceof Error ? e.message : "Invalid JSON",
			});
		}
	};

	const onSubmit = form.handleSubmit(async (data) => {
		const response = await useServer<AdminCreateDatasetRequest, AdminCreateDatasetResponse>({
			method: "POST",
			path: "/datasets/create",
			data,
		});

		if (response.result === "success") {
			toast.success("Dataset created successfully");
			navigate("/panel/datasets");
		} else {
			toast.error("Failed to create dataset: " + response.error);
		}
	});

	return (
		<ScreenTemplate
			title="New Dataset"
			backPath="/panel/datasets"
			scrollable={false}>
			<div className="flex h-full flex-col space-y-4 pb-4">
				<Form {...form}>
					<form
						onSubmit={onSubmit}
						className="flex h-full flex-col space-y-4">
						<Card>
							<CardContent className="pt-6">
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Dataset Name</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder="e.g. Neo-Tag: Central Park"
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
												<div className="flex gap-2">
													<FormControl>
														<Select
															value={field.value}
															onValueChange={(v) => {
																field.onChange(v);
															}}>
															<SelectTrigger className="bg-background flex-1">
																<SelectValue />
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
													<ConfirmButton
														variant="secondary"
														onClick={handleGenerateTemplate}
														className="shrink-0"
														confirmMessage="This will override any existing configuration">
														<Sparkles className="mr-1 size-4" />
														Generate Template
													</ConfirmButton>
												</div>
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
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleFormatJson}>
									<TextAlignStart className="mr-2 size-4" />
									Format
								</Button>
							</div>
							<div className="relative flex-1">
								<Editor
									height="100%"
									defaultLanguage="json"
									value={jsonContent}
									onChange={handleEditorChange}
									theme="vs-dark"
									onMount={(editor, monaco) => {
										editorRef.current = editor;
										monacoRef.current = monaco;
										updateEditorMarkers(monaco, editor, jsonContent, form.formState.errors.data);
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
							{form.formState.errors.data && (
								<p className="text-destructive px-4 py-2 text-sm font-medium">
									{String(form.formState.errors.data.message)}
								</p>
							)}
						</div>

						<div className="flex justify-end pt-2">
							<Button
								type="submit"
								size="lg"
								disabled={form.formState.isSubmitting}
								className="flex gap-2 font-semibold shadow-sm">
								<Save className="size-4" />
								Create Dataset
							</Button>
						</div>
					</form>
				</Form>
			</div>
		</ScreenTemplate>
	);
};

export default NewDatasetScreen;
