/* eslint-disable react-hooks/set-state-in-effect */
import {
	AdminDatasetInfoResponse,
	AdminNewDatasetVersionRequest,
	formatGameType,
	getDatasetInputSchema,
} from "@jetlag/shared-types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";

import ScreenTemplate from "@/components/ScreenTemplate";
import ValidatedJsonEditor, { ValidatedJsonEditorHandle } from "@/components/ValidatedJsonEditor";
import { Button } from "@/components/ui/button";
import { useServer } from "@/lib/server";
import { AlertCircle, FileJson, Loader2, MapPinned, Save, TextAlignStart } from "lucide-react";
import { toast } from "sonner";

const ManageDatasetScreen = () => {
	const dataset = useLoaderData() as AdminDatasetInfoResponse;
	const navigate = useNavigate();
	const editorRef = useRef<ValidatedJsonEditorHandle>(null);

	const [editedData, setEditedData] = useState<object>(() => dataset?.data || {});
	const [schemaError, setSchemaError] = useState<string | null>(null);

	const schema = useMemo(() => (dataset ? getDatasetInputSchema(dataset.gameType) : undefined), [dataset]);

	useEffect(() => {
		if (dataset?.data) {
			setEditedData(dataset.data);
		}
	}, [dataset]);

	useEffect(() => {
		if (!editedData || Object.keys(editedData).length === 0) {
			setSchemaError(null);
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

		const response = await useServer<AdminNewDatasetVersionRequest, void>({
			method: "POST",
			path: "/datasets/version/add",
			data: {
				metadataId: dataset.metadataId,
				data: editedData,
			},
			voidResponse: true,
		});

		if (response.result === "success") {
			toast.success("New version saved successfully");
			navigate(".", { replace: true });
		}
	};

	if (dataset.lastVersion === 0)
		return (
			<ScreenTemplate
				title="Manage Dataset"
				backPath="/panel/datasets"
				scrollable={false}>
				<div className="flex size-full items-center justify-center">
					<div className="bg-card relative z-10 w-full max-w-md rounded-2xl border border-white/10 p-8">
						<h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
							<Loader2 className="size-7 animate-spin" />
							Processing...
						</h1>
						<p className="text-xs leading-relaxed text-white/60">
							This dataset is currently being processed. Please wait a moment and refresh the page to see
							the dataset details.
						</p>
					</div>
				</div>
			</ScreenTemplate>
		);

	return (
		<ScreenTemplate
			title="Manage Dataset"
			backPath="/panel/datasets"
			scrollable={false}>
			<div className="flex h-full min-h-0 w-full flex-col gap-6 overflow-y-auto pr-1 lg:flex-row lg:overflow-hidden">
				{/* Left Panel: Clean Info Column */}
				<div className="bg-card flex h-fit w-full flex-none flex-col justify-between rounded-xl border p-6 shadow-xs lg:h-full lg:w-80">
					<div className="space-y-4">
						<div>
							<div className="mb-2 flex items-center gap-2">
								<div className="bg-primary/10 text-primary rounded-lg p-2">
									<MapPinned className="size-6" />
								</div>
							</div>
							<h2 className="text-xl font-bold">{dataset.name}</h2>
							<p className="text-muted-foreground font-mono text-xs">
								Dataset #{dataset.metadataId}, v{dataset.lastVersion}
							</p>
						</div>

						<div className="text-muted-foreground border-t pt-4 text-sm">
							This dataset is intended for the game mode {formatGameType(dataset.gameType)}
						</div>
						<div className="text-muted-foreground text-sm">
							If you need to change something, you can do it here. Already created games will not reflect
							your changes, but new games will use the new version of the dataset.
						</div>
					</div>

					<div className="mt-8 border-t pt-6 lg:mt-0">
						<Button
							onClick={handleSaveVersion}
							className="flex w-full items-center justify-center gap-2 font-semibold shadow-xs">
							<Save className="size-4" />
							Save New Version
						</Button>
					</div>
				</div>

				{/* Right Panel: Editor */}
				<div className="bg-card flex min-h-112.5 flex-1 flex-col overflow-hidden rounded-xl border shadow-xs lg:h-full lg:min-h-0">
					<div className="bg-muted/30 flex flex-none flex-col justify-between gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:py-2">
						<div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
							<FileJson className="size-4" />
							Dataset editor
						</div>

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
						onChange={(val) => setEditedData(val ?? {})}
						className="flex-1 rounded-none border-0"
					/>
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default ManageDatasetScreen;
