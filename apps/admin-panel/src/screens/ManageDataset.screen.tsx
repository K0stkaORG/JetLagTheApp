import { AdminAddDatasetVersionRequest, AdminDatasetInfoResponse } from "@jetlag/shared-types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";

import ScreenTemplate from "@/components/ScreenTemplate";
import ValidatedJsonEditor, { ValidatedJsonEditorHandle } from "@/components/ValidatedJsonEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useServer } from "@/lib/server";
import { getDatasetSchema } from "@jetlag/shared-types";
import { AlertCircle, FileJson, Info, Save, TextAlignStart } from "lucide-react";
import { toast } from "sonner";

const ManageDatasetScreen = () => {
	const dataset = useLoaderData() as AdminDatasetInfoResponse;
	const navigate = useNavigate();
	const editorRef = useRef<ValidatedJsonEditorHandle>(null);

	// Track the parsed object; initialise once the dataset loads.
	const [editedData, setEditedData] = useState<object | undefined>(undefined);

	// Keep track of the first validation issue message (if any) to display in the header
	const [schemaError, setSchemaError] = useState<string | null>(null);

	const schema = useMemo(() => (dataset ? getDatasetSchema(dataset.gameType) : undefined), [dataset]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		if (dataset?.data) setEditedData(dataset.data);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dataset.id, dataset.lastVersion]);

	// Run Zod evaluation whenever the parsed object updates to keep the header error state in sync
	useEffect(() => {
		if (!editedData) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSchemaError("Invalid JSON content");
			return;
		}
		if (schema) {
			const result = schema.safeParse(editedData);
			if (!result.success) {
				setSchemaError(result.error.issues[0]?.message || "Invalid dataset format");
			} else {
				setSchemaError(null);
			}
		} else {
			setSchemaError(null);
		}
	}, [editedData, schema]);

	const handleSaveVersion = async () => {
		if (!editedData) {
			toast.error("Cannot save: the JSON content is invalid");
			return;
		}

		if (schema) {
			const result = schema.safeParse(editedData);
			if (!result.success) {
				toast.error("Cannot save: dataset does not match the schema");
				return;
			}
		}

		const response = await useServer<AdminAddDatasetVersionRequest, void>({
			method: "POST",
			path: "/datasets/version/add",
			data: {
				datasetId: dataset.id,
				data: editedData,
			},
		});

		if (response.result === "success") {
			toast.success("New version saved successfully");
			navigate(".", { replace: true });
		} else {
			toast.error("Failed to save version: " + response.error);
		}
	};

	return (
		<ScreenTemplate
			title="Manage Dataset"
			backPath="/panel/datasets"
			scrollable={false}>
			<div className="flex h-full min-h-0 w-full flex-col gap-6 overflow-y-auto pr-1 lg:flex-row lg:overflow-hidden">
				{/* Left Panel: Info and Version controls */}
				<div className="bg-card flex h-fit w-full flex-none flex-col justify-between rounded-xl border p-6 shadow-sm lg:h-full lg:w-80">
					<div className="space-y-6">
						<div>
							<div className="mb-2 flex items-center gap-2">
								<div className="bg-primary/10 text-primary rounded-lg p-2">
									<Info className="size-6" />
								</div>
							</div>
							<h2 className="text-xl font-bold">{dataset.name}</h2>
							<p className="text-muted-foreground text-xs font-medium">Manage Dataset</p>
						</div>

						<div className="space-y-4">
							<div className="bg-muted/40 flex items-center justify-between rounded-lg border p-3">
								<span className="text-muted-foreground text-xs font-semibold">Game Type</span>
								<span className="text-xs font-bold capitalize">{dataset.gameType}</span>
							</div>

							<div className="bg-muted/40 flex items-center justify-between rounded-lg border p-3">
								<span className="text-muted-foreground text-xs font-semibold">Current Version</span>
								<Badge
									variant="outline"
									className="font-mono text-xs">
									v.{dataset.lastVersion}
								</Badge>
							</div>
						</div>
					</div>

					<div className="mt-8 border-t pt-6 lg:mt-0">
						<Button
							onClick={handleSaveVersion}
							className="flex w-full items-center justify-center gap-2 font-semibold shadow-sm">
							<Save className="size-4" />
							Save New Version
						</Button>
					</div>
				</div>

				{/* Right Panel: Editor */}
				<div className="bg-card flex min-h-112.5 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm lg:h-full lg:min-h-0">
					<div className="bg-muted/30 flex flex-none flex-col justify-between gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:py-2">
						<div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
							<FileJson className="size-4" />
							Data Editor (Does not really work)
						</div>

						{/* Header-based Error Indicator */}
						<div className="flex flex-wrap items-center gap-3">
							{schemaError && (
								<span className="text-destructive flex max-w-xs animate-pulse items-center gap-1.5 truncate text-xs font-semibold">
									<AlertCircle className="size-3.5 shrink-0" />
									{schemaError}
								</span>
							)}
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

					<ValidatedJsonEditor
						ref={editorRef}
						value={editedData}
						zodSchema={schema}
						onChange={setEditedData}
						className="flex-1 rounded-none border-0"
					/>
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default ManageDatasetScreen;
