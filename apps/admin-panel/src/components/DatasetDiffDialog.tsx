import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AdminDatasetVersionInfo, stringifyConfigJSON } from "@jetlag/shared-types";
import { DiffEditor } from "@monaco-editor/react";
import { ArrowLeftRight, Check, Columns2, FileDiff, Loader2, Rows2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface DatasetDiffDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	datasetName: string;
	versions: AdminDatasetVersionInfo[];
	currentDraftData?: object;
}

const DRAFT_KEY = "draft";

export function DatasetDiffDialog({
	open,
	onOpenChange,
	datasetName,
	versions,
	currentDraftData,
}: DatasetDiffDialogProps) {
	// Sorted descending by version number (e.g. [v11, v10, ...])
	const sortedVersions = useMemo(() => {
		return [...versions].sort((a, b) => b.version - a.version);
	}, [versions]);

	// Initial default selections: Left = Latest Version, Right = Current Editor Draft
	const defaultLeft = sortedVersions[0] ? String(sortedVersions[0].version) : "";
	const defaultRight = currentDraftData ? DRAFT_KEY : defaultLeft;

	const [leftKey, setLeftKey] = useState<string>(defaultLeft);
	const [rightKey, setRightKey] = useState<string>(defaultRight);
	const [isSideBySide, setIsSideBySide] = useState<boolean>(true);
	const [hideUnchanged, setHideUnchanged] = useState<boolean>(true);
	const [isDiffComputing, setIsDiffComputing] = useState<boolean>(false);

	// Refs to always access freshest state inside async event listeners
	const hideUnchangedRef = useRef(hideUnchanged);
	hideUnchangedRef.current = hideUnchanged;
	const isSideBySideRef = useRef(isSideBySide);
	isSideBySideRef.current = isSideBySide;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const editorRef = useRef<any>(null);

	// Reset default options on dialog open: Left = Latest Version, Right = Current Editor Draft
	useEffect(() => {
		if (open && sortedVersions.length > 0) {
			setIsDiffComputing(true);
			const latestVer = String(sortedVersions[0].version);
			setLeftKey(latestVer);
			setRightKey(currentDraftData ? DRAFT_KEY : latestVer);
		}
	}, [open, sortedVersions, currentDraftData]);

	// Trigger layout refresh when dialog opens to handle Radix animation
	useEffect(() => {
		if (open) {
			const timer = setTimeout(() => {
				if (editorRef.current) {
					editorRef.current.layout();
					editorRef.current.updateOptions({
						hideUnchangedRegions: {
							enabled: hideUnchangedRef.current,
							contextLineCount: 3,
							minimumLineCount: 3,
							revealLineCount: 20,
						},
						compactMode: !isSideBySideRef.current,
					});
				}
			}, 120);
			return () => clearTimeout(timer);
		}
	}, [open]);

	// Trigger computing indicator when selection changes
	const handleSelectLeft = (val: string) => {
		setIsDiffComputing(true);
		setLeftKey(val);
	};

	const handleSelectRight = (val: string) => {
		setIsDiffComputing(true);
		setRightKey(val);
	};

	const handleSwap = () => {
		setIsDiffComputing(true);
		setLeftKey(rightKey);
		setRightKey(leftKey);
	};

	// Retrieve data for left selection
	const leftData = useMemo(() => {
		if (leftKey === DRAFT_KEY) {
			return currentDraftData ?? {};
		}
		const verNum = Number(leftKey);
		const found = sortedVersions.find((v) => v.version === verNum);
		return found?.data ?? {};
	}, [leftKey, sortedVersions, currentDraftData]);

	// Retrieve data for right selection
	const rightData = useMemo(() => {
		if (rightKey === DRAFT_KEY) {
			return currentDraftData ?? {};
		}
		const verNum = Number(rightKey);
		const found = sortedVersions.find((v) => v.version === verNum);
		return found?.data ?? {};
	}, [rightKey, sortedVersions, currentDraftData]);

	const leftFormatted = useMemo(() => stringifyConfigJSON(leftData), [leftData]);
	const rightFormatted = useMemo(() => stringifyConfigJSON(rightData), [rightData]);
	const hasDiff = leftFormatted !== rightFormatted;


	// When user toggles hideUnchanged or split/inline, update editor options in-place without remounting or re-calculating diff
	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.updateOptions({
				renderSideBySide: isSideBySide,
				hideUnchangedRegions: {
					enabled: hideUnchanged,
					contextLineCount: 3,
					minimumLineCount: 3,
					revealLineCount: 20,
				},
			});
			editorRef.current.getOriginalEditor()?.updateOptions({
				lineNumbers: isSideBySide ? "on" : "off",
				lineDecorationsWidth: isSideBySide ? undefined : 0,
				lineNumbersMinChars: isSideBySide ? undefined : 0,
				glyphMargin: isSideBySide,
				folding: isSideBySide,
			});
			editorRef.current.layout();
		}
	}, [hideUnchanged, isSideBySide]);

	// Memoize DiffEditor options
	const diffEditorOptions = useMemo(
		() => ({
			readOnly: true,
			renderSideBySide: isSideBySide,
			renderOverviewRuler: true,
			renderIndicators: true,
			hideUnchangedRegions: {
				enabled: hideUnchanged,
				contextLineCount: 3,
				minimumLineCount: 3,
				revealLineCount: 20,
			},
			minimap: { enabled: false },
			automaticLayout: true,
			fontSize: 13,
			fontFamily: "monospace",
			scrollBeyondLastLine: false,
			scrollbar: {
				vertical: "auto" as const,
				horizontal: "auto" as const,
				verticalScrollbarSize: 8,
				horizontalScrollbarSize: 8,
				verticalSliderSize: 8,
				horizontalSliderSize: 8,
				useShadows: false,
			},
		}),
		[isSideBySide, hideUnchanged],
	);

	const getVersionLabel = (ver: AdminDatasetVersionInfo) => {
		const stateTag =
			ver.state === "latest"
				? " (latest)"
				: ver.state === "parsing"
					? " (processing)"
					: ver.state === "errored"
						? " (failed)"
						: "";
		return `v${ver.version}${stateTag}`;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton
				className="flex flex-col sm:max-w-[95vw] w-[95vw] h-[90vh] max-h-[92vh] gap-3 rounded-2xl border bg-card p-4 sm:p-6 shadow-2xl overflow-hidden">
				<DialogHeader className="flex flex-none flex-col gap-1 pb-1">
					<div className="flex items-center gap-2">
						<div className="rounded-lg bg-primary/10 p-1.5 text-primary">
							<FileDiff className="size-5" />
						</div>
						<DialogTitle className="text-xl font-bold">
							Compare Versions &mdash; {datasetName}
						</DialogTitle>
					</div>
					<DialogDescription className="text-xs text-muted-foreground">
						Compare changes between versions or against your current editor draft.
					</DialogDescription>
				</DialogHeader>

				{/* Unified Card Container matching standard JsonEditorCard layout */}
				<div className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-xs">
					{/* Card Header */}
					<div className="bg-muted/30 flex flex-none flex-col justify-between gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:py-2">
						{/* Left: Dropdowns & Swap */}
						<div className="flex items-center gap-2">
							<Select value={leftKey} onValueChange={handleSelectLeft}>
								<SelectTrigger className="h-8 w-44 text-xs font-medium bg-background">
									<SelectValue placeholder="Select version" />
								</SelectTrigger>
								<SelectContent>
									{currentDraftData && (
										<SelectItem value={DRAFT_KEY}>Current Editor Draft</SelectItem>
									)}
									{sortedVersions.map((v) => (
										<SelectItem key={v.version} value={String(v.version)}>
											{getVersionLabel(v)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								onClick={handleSwap}
								title="Swap versions"
								className="rounded-lg text-muted-foreground hover:text-foreground">
								<ArrowLeftRight className="size-3.5" />
							</Button>

							<Select value={rightKey} onValueChange={handleSelectRight}>
								<SelectTrigger className="h-8 w-44 text-xs font-medium bg-background">
									<SelectValue placeholder="Select version" />
								</SelectTrigger>
								<SelectContent>
									{currentDraftData && (
										<SelectItem value={DRAFT_KEY}>Current Editor Draft</SelectItem>
									)}
									{sortedVersions.map((v) => (
										<SelectItem key={v.version} value={String(v.version)}>
											{getVersionLabel(v)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Status indicator */}
							<div className="ml-2 flex items-center">
								{isDiffComputing ? (
									<span className="flex items-center gap-1.5 text-xs text-primary font-medium animate-pulse">
										<Loader2 className="size-3.5 animate-spin" />
										Calculating diff…
									</span>
								) : !hasDiff ? (
									<span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
										<Check className="size-3.5 text-emerald-400" />
										No changes
									</span>
								) : null}
							</div>
						</div>

						{/* Right: Checkbox & Split/Inline controls */}
						<div className="flex flex-wrap items-center gap-4">
							{/* Checkbox for Collapse Unchanged */}
							<label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
								<input
									type="checkbox"
									checked={hideUnchanged}
									onChange={(e) => setHideUnchanged(e.target.checked)}
									className="size-4 rounded border-input bg-background accent-primary cursor-pointer"
								/>
								<span>Collapse unchanged</span>
							</label>

							{/* Split / Inline Segmented Control */}
							<div className="flex items-center rounded-lg border bg-background/50 p-0.5">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className={cn(
										"h-7 gap-1.5 px-2.5 text-xs transition-all",
										isSideBySide
											? "bg-accent text-accent-foreground font-semibold shadow-xs"
											: "text-muted-foreground hover:text-foreground",
									)}
									onClick={() => setIsSideBySide(true)}>
									<Columns2 className="size-3.5" />
									Split
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className={cn(
										"h-7 gap-1.5 px-2.5 text-xs transition-all",
										!isSideBySide
											? "bg-accent text-accent-foreground font-semibold shadow-xs"
											: "text-muted-foreground hover:text-foreground",
									)}
									onClick={() => setIsSideBySide(false)}>
									<Rows2 className="size-3.5" />
									Inline
								</Button>
							</div>
						</div>
					</div>

					{/* Card Body: Diff Editor */}
					<div className="relative min-h-0 flex-1 w-full overflow-hidden bg-[#1e1e1e]">
						<DiffEditor
							key={`${leftKey}-${rightKey}`}
							height="100%"
							width="100%"
							language="json"
							original={leftFormatted}
							modified={rightFormatted}
							theme="vs-dark"
							loading={
								<div className="flex h-full w-full items-center justify-center gap-2 text-xs text-muted-foreground">
									<Loader2 className="size-4 animate-spin text-primary" />
									Loading diff editor…
								</div>
							}
							onMount={(editor) => {
								editorRef.current = editor;
								if (!isSideBySide) {
									editor.getOriginalEditor().updateOptions({
										lineNumbers: "off",
										glyphMargin: false,
										folding: false,
										lineDecorationsWidth: 0,
										lineNumbersMinChars: 0,
									});
								}
								editor.onDidUpdateDiff(() => {
									setIsDiffComputing(false);
									editor.layout();
								});
								// If line changes are already calculated, clear computing status; otherwise wait for onDidUpdateDiff
								if (editor.getLineChanges() !== null) {
									setIsDiffComputing(false);
								}
								setTimeout(() => {
									editor.layout();
								}, 80);
							}}
							options={diffEditorOptions}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
