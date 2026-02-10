import {
	AdminCreateDatasetRequest,
	AdminCreateDatasetResponse,
	GameType,
	GameTypes,
	getDatasetTemplate,
} from "@jetlag/shared-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ScreenTemplate from "@/components/ScreenTemplate";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useServer } from "@/lib/server";
import { Card, CardContent } from "@/components/ui/card";
import { FileJson, Save, Sparkles } from "lucide-react";

const NewDatasetScreen = () => {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [gameType, setGameType] = useState<GameType>(GameTypes[0]);
	const [jsonContent, setJsonContent] = useState<string>("{\n\t\n}");

	const handleGenerateTemplate = () => {
		const template = getDatasetTemplate(gameType);
		setJsonContent(JSON.stringify(template, null, 4));
		toast.success("Template generated successfully");
	};

	const handleCreate = async () => {
		let parsedData: any;
		try {
			// Validate JSON locally first to give quick feedback (optional, server does it too)
			parsedData = JSON.parse(jsonContent);
		} catch (e) {
			toast.error("Invalid JSON content");
			return;
		}

		const response = await useServer<AdminCreateDatasetRequest, AdminCreateDatasetResponse>({
			method: "POST",
			path: "/datasets/create",
			data: {
				name,
				gameType,
				data: parsedData,
			},
		});

		if (response.result === "success") {
			toast.success("Dataset created successfully");
			navigate("/panel/datasets");
		} else {
			toast.error("Failed to create dataset: " + response.error);
		}
	};

	return (
		<ScreenTemplate
			title="New Dataset"
			backPath="/panel/datasets"
			scrollable={false}>
			<div className="space-y-4 h-full flex flex-col pb-4">
				<Card>
					<CardContent className="pt-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label>Dataset Name</Label>
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. Neo-Tag: Central Park"
									className="bg-background"
								/>
							</div>
							<div className="space-y-2">
								<Label>Game Type</Label>
								<div className="flex gap-2">
									<Select
										value={gameType}
										onValueChange={(v) => setGameType(v as GameType)}>
										<SelectTrigger className="flex-1 bg-background">
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
									<Button
										variant="secondary"
										onClick={handleGenerateTemplate}
										className="shrink-0"
										title="Generate Template for selected game type">
										<Sparkles className="size-4 mr-2" />
										Template
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="flex-1 flex flex-col min-h-[500px] bg-card rounded-xl border overflow-hidden shadow-sm">
					<div className="border-b bg-muted/30 px-4 py-2 flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
							<FileJson className="size-4" />
							JSON Editor
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
						onClick={handleCreate}
						size="lg"
						disabled={!name}
						className="flex gap-2 shadow-sm font-semibold">
						<Save className="size-4" />
						Create Dataset
					</Button>
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default NewDatasetScreen;
