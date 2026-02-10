import { AdminAddDatasetVersionRequest, AdminDatasetInfoResponse } from "@jetlag/shared-types";
import { Card, CardContent } from "@/components/ui/card";
import { useLoaderData, useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import { FileJson, Info, Save } from "lucide-react";
import ScreenTemplate from "@/components/ScreenTemplate";
import { toast } from "sonner";
import { useServer } from "@/lib/server";
import { Badge } from "@/components/ui/badge";

const ManageDatasetScreen = () => {
	const dataset = useLoaderData() as AdminDatasetInfoResponse;
	const navigate = useNavigate();
	const [jsonContent, setJsonContent] = useState<string>("");

	useEffect(() => {
		if (dataset && dataset.data) {
			setJsonContent(JSON.stringify(dataset.data, null, 4));
		}
	}, [dataset]);

	const handleSaveVersion = async () => {
		let parsedData: any;
		try {
			parsedData = JSON.parse(jsonContent);
		} catch (e) {
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
			<div className="space-y-4 h-full flex flex-col pb-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="p-2 bg-muted rounded-lg">
									<Info className="size-6 text-muted-foreground" />
								</div>
								<div>
									<h2 className="text-xl font-bold">{dataset.name}</h2>
									<p className="text-sm text-muted-foreground">
										Game Type:{" "}
										<span className="font-semibold text-foreground">{dataset.gameType}</span>
									</p>
								</div>
							</div>
							<div className="flex flex-col items-end gap-1">
								<Badge
									variant="outline"
									className="font-mono">
									v.{dataset.lastVersion}
								</Badge>
								<span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
									Current Version
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="flex-1 flex flex-col min-h-[500px] bg-card rounded-xl border overflow-hidden shadow-sm">
					<div className="border-b bg-muted/30 px-4 py-2 flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
							<FileJson className="size-4" />
							Data Editor
						</div>
					</div>
					<div className="flex-1 relative">
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
						className="flex gap-2 shadow-sm font-semibold">
						<Save className="size-4" />
						Save as New Version
					</Button>
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default ManageDatasetScreen;
