import { Card, CardContent } from "@/components/ui/card";
import { AdminAddDatasetVersionRequest, AdminDatasetInfoResponse } from "@jetlag/shared-types";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";

import ScreenTemplate from "@/components/ScreenTemplate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useServer } from "@/lib/server";
import { stringifyConfigJSON } from "@jetlag/shared-types/src/models/helpers";
import Editor from "@monaco-editor/react";
import { FileJson, Info, Save } from "lucide-react";
import { toast } from "sonner";

const ManageDatasetScreen = () => {
	const dataset = useLoaderData() as AdminDatasetInfoResponse;
	const navigate = useNavigate();
	const [jsonContent, setJsonContent] = useState<string>("");

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		if (dataset && dataset.data) setJsonContent(stringifyConfigJSON(dataset.data));
	}, [dataset]);

	const handleSaveVersion = async () => {
		let parsedData: object;
		try {
			parsedData = JSON.parse(jsonContent);
		} catch {
			toast.error("Invalid JSON content");
			return;
		}

		const response = await useServer<AdminAddDatasetVersionRequest, void>({
			method: "POST",
			path: "/datasets/version/add",
			data: {
				datasetId: dataset.id,
				data: parsedData,
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
			<div className="flex h-full flex-col space-y-4 pb-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="bg-muted rounded-lg p-2">
									<Info className="text-muted-foreground size-6" />
								</div>
								<div>
									<h2 className="text-xl font-bold">{dataset.name}</h2>
									<p className="text-muted-foreground text-sm">
										Game Type:{" "}
										<span className="text-foreground font-semibold">{dataset.gameType}</span>
									</p>
								</div>
							</div>
							<div className="flex flex-col items-end gap-1">
								<Badge
									variant="outline"
									className="font-mono">
									v.{dataset.lastVersion}
								</Badge>
								<span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
									Current Version
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="bg-card flex min-h-125 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
					<div className="bg-muted/30 flex items-center justify-between border-b px-4 py-2">
						<div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
							<FileJson className="size-4" />
							Data Editor
						</div>
					</div>
					<div className="relative flex-1">
						<Editor
							height="100%"
							defaultLanguage="json"
							value={jsonContent}
							onChange={(value) => setJsonContent(value ?? "")}
							theme="vs-dark"
							options={{
								minimap: { enabled: false },
								automaticLayout: true,
								fontSize: 14,
								fontFamily: "monospace",
								scrollBeyondLastLine: false,
							}}
						/>
					</div>
				</div>

				<div className="flex justify-end pt-2">
					<Button
						onClick={handleSaveVersion}
						size="lg"
						className="flex gap-2 font-semibold shadow-sm">
						<Save className="size-4" />
						Save as New Version
					</Button>
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default ManageDatasetScreen;
