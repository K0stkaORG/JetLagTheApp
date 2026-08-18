/* eslint-disable react-hooks/set-state-in-effect */
import {
	AdminDatasetInfoResponse,
	AdminNewDatasetVersionRequest,
	DatasetState,
	formatGameType,
	getDatasetInputSchema,
} from "@jetlag/shared-types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";

import ScreenTemplate from "@/components/ScreenTemplate";
import ValidatedJsonEditor, { ValidatedJsonEditorHandle } from "@/components/ValidatedJsonEditor";
import JsonEditorCard from "@/components/JsonEditorCard";
import { DatasetDiffDialog } from "@/components/DatasetDiffDialog";
import { Button } from "@/components/ui/button";
import { useServer } from "@/lib/server";
import { AlertCircle, FileDiff, Loader2, MapPinned, Save } from "lucide-react";
import { toast } from "sonner";

const STATE_BADGE: Record<DatasetState, React.ReactNode> = {
	parsing: (
		<span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400">
			<Loader2 className="size-3 animate-spin" />
			Processing…
		</span>
	),
	errored: (
		<span className="bg-destructive/15 text-destructive flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
			<AlertCircle className="size-3" />
			Processing Failed
		</span>
	),
	latest: null,
	outdated: null,
};

const ManageDatasetScreen = () => {
	const dataset = useLoaderData() as AdminDatasetInfoResponse;
	const navigate = useNavigate();
	const editorRef = useRef<ValidatedJsonEditorHandle>(null);

	const isReadOnly = dataset.state !== "latest";

	const [editedData, setEditedData] = useState<object>(() => dataset?.data || {});
	const [schemaError, setSchemaError] = useState<string | null>(null);
	const [isDiffOpen, setIsDiffOpen] = useState(false);

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
								Dataset #{dataset.metadataId}
								{dataset.lastVersion != null ? `, v${dataset.lastVersion}` : ""}
							</p>
						</div>

						{STATE_BADGE[dataset.state] && <div>{STATE_BADGE[dataset.state]}</div>}

						<div className="text-muted-foreground border-t pt-4 text-sm">
							This dataset is intended for the game mode {formatGameType(dataset.gameType)}
						</div>
						{!isReadOnly && (
							<div className="text-muted-foreground text-sm">
								If you need to change something, you can do it here. Already created games will not
								reflect your changes, but new games will use the new version of the dataset.
							</div>
						)}
					</div>

					<div className="mt-8 border-t pt-6 lg:mt-0">
						{dataset.state === "parsing" ? (
							<p className="text-muted-foreground text-center text-xs">
								Editing is disabled while the dataset is being processed.
							</p>
						) : (
							<Button
								onClick={handleSaveVersion}
								className="flex w-full items-center justify-center gap-2 font-semibold shadow-xs">
								<Save className="size-4" />
								Save New Version
							</Button>
						)}
					</div>
				</div>

				{/* Right Panel: Editor */}
				<JsonEditorCard
					title="Dataset editor"
					error={schemaError && !isReadOnly ? schemaError : null}
					actions={
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setIsDiffOpen(true)}>
							<FileDiff className="mr-1.5 size-3.5" />
							Compare Versions
						</Button>
					}
					editorRef={editorRef}
					readOnly={isReadOnly}>
					<ValidatedJsonEditor
						ref={editorRef}
						value={editedData}
						zodSchema={isReadOnly ? undefined : schema}
						onChange={(val) => setEditedData(val ?? {})}
						readOnly={isReadOnly}
						className="flex-1 rounded-none border-0"
					/>
				</JsonEditorCard>
			</div>

			<DatasetDiffDialog
				open={isDiffOpen}
				onOpenChange={setIsDiffOpen}
				datasetName={dataset.name}
				versions={dataset.versions || []}
				currentDraftData={editedData}
			/>
		</ScreenTemplate>
	);
};

export default ManageDatasetScreen;
