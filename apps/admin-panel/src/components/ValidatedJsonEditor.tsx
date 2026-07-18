/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { findJsonPathPosition, getPositionFromJsonError } from "@/lib/monaco-helpers";
import { cn } from "@/lib/utils";
import { stringifyConfigJSON } from "@jetlag/shared-types/src/models/helpers";
import Editor from "@monaco-editor/react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ZodType } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidatedJsonEditorHandle {
	/** Re-formats the current JSON content in-place. No-op if the JSON is invalid. */
	format(): void;
}

interface ValidatedJsonEditorProps {
	value?: object | null;
	onChange?: (value: object | undefined) => void;
	onBlur?: () => void;
	zodSchema?: ZodType;
	height?: string;
	className?: string;
	// Forwarded by <FormControl> (Radix Slot)
	"aria-invalid"?: boolean | "true" | "false";
	"aria-describedby"?: string;
	id?: string;
}

// ---------------------------------------------------------------------------
// Module helpers
// ---------------------------------------------------------------------------

function parseJsonObject(str: string): { parsed: object; error: null } | { parsed: null; error: Error } {
	try {
		const val = JSON.parse(str);
		if (typeof val !== "object" || val === null || Array.isArray(val)) {
			return { parsed: null, error: new Error("Value must be a JSON object") };
		}
		return { parsed: val, error: null };
	} catch (e) {
		return { parsed: null, error: e instanceof Error ? e : new Error("Invalid JSON") };
	}
}

/**
 * Robustly inspects the raw text for trailing commas before objects or array closures
 * to deliver exact line placement if standard JSON parsing collapses.
 */
function locateTrailingCommaPosition(json: string): { line: number; column: number; message: string } | null {
	// Matches commas followed directly by object/array terminations, ignoring whitespace
	const trailingCommaRegex = /,(?=\s*[}\]])/g;
	let match;
	let lastMatch = null;

	while ((match = trailingCommaRegex.exec(json)) !== null) {
		lastMatch = match;
	}

	if (lastMatch !== null) {
		const index = lastMatch.index;
		const linesUpToMatch = json.substring(0, index).split("\n");
		const line = linesUpToMatch.length;
		const column = linesUpToMatch[linesUpToMatch.length - 1].length + 1;
		return {
			line,
			column,
			message: "Trailing comma is not allowed in standard JSON",
		};
	}
	return null;
}

function safeFindJsonPathPosition(json: string, path: (string | number)[]): { line: number; column: number } {
	const currentPath = [...path];
	while (currentPath.length > 0) {
		try {
			const loc = findJsonPathPosition(json, currentPath);
			if (loc && typeof loc.line === "number" && !isNaN(loc.line) && loc.line > 1) {
				return loc;
			}
		} catch {}
		currentPath.pop();
	}
	try {
		const rootLoc = findJsonPathPosition(json, []);
		if (rootLoc && typeof rootLoc.line === "number" && !isNaN(rootLoc.line)) {
			return rootLoc;
		}
	} catch {}
	return { line: 1, column: 1 };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ValidatedJsonEditor = forwardRef<ValidatedJsonEditorHandle, ValidatedJsonEditorProps>(
	({ value, onChange, onBlur, zodSchema, height = "100%", className, ...ariaProps }, ref) => {
		const editorRef = useRef<any>(null);
		const monacoRef = useRef<any>(null);
		const decorationIdsRef = useRef<string[]>([]);
		const isWritingRef = useRef(false);

		const onChangeRef = useRef(onChange);
		const onBlurRef = useRef(onBlur);
		onChangeRef.current = onChange;
		onBlurRef.current = onBlur;

		const activeSchemaRef = useRef<ZodType | undefined>(zodSchema);
		if (zodSchema) {
			activeSchemaRef.current = zodSchema;
		}

		const [initialJson] = useState(() => (value != null ? stringifyConfigJSON(value) : ""));
		const lastValidJsonRef = useRef<string>(initialJson);

		// ------------------------------------------------------------------
		// Native Validation Processor
		// ------------------------------------------------------------------
		const runNativeValidation = (model: any) => {
			const monacoInst = monacoRef.current;
			const editorInst = editorRef.current;
			if (!monacoInst || !editorInst || !model) return;

			const json = model.getValue();
			const markers: any[] = [];
			const errorsByLine: Record<number, string[]> = {};

			// Pillar 1: Intercept trailing syntax failures natively before standard engine execution
			const trailingCommaError = locateTrailingCommaPosition(json);
			const { parsed, error: syntaxError } = parseJsonObject(json);

			if (trailingCommaError) {
				markers.push({
					startLineNumber: trailingCommaError.line,
					startColumn: trailingCommaError.column,
					endLineNumber: trailingCommaError.line,
					endColumn: trailingCommaError.column + 1,
					message: trailingCommaError.message,
					severity: monacoInst.MarkerSeverity.Error,
				});
				errorsByLine[trailingCommaError.line] = [trailingCommaError.message];
			} else if (syntaxError) {
				if (json.trim() !== "") {
					const loc = getPositionFromJsonError(json, syntaxError);
					const determinedLine = loc && typeof loc.line === "number" && !isNaN(loc.line) ? loc.line : 1;
					const determinedCol = loc && typeof loc.column === "number" && !isNaN(loc.column) ? loc.column : 1;

					markers.push({
						startLineNumber: determinedLine,
						startColumn: determinedCol,
						endLineNumber: determinedLine,
						endColumn: determinedCol + 1,
						message: syntaxError.message,
						severity: monacoInst.MarkerSeverity.Error,
					});

					if (!errorsByLine[determinedLine]) errorsByLine[determinedLine] = [];
					errorsByLine[determinedLine].push(syntaxError.message);
				}
			} else if (activeSchemaRef.current && parsed) {
				try {
					const result = activeSchemaRef.current.safeParse(parsed);
					if (!result.success) {
						for (const issue of result.error.issues) {
							const issuePath = issue.path as (string | number)[];
							const loc = safeFindJsonPathPosition(json, issuePath);

							if (loc && typeof loc.line === "number" && !isNaN(loc.line)) {
								const lastSeg = issuePath[issuePath.length - 1];
								const label = issuePath.length > 0 ? `[${issuePath.join(".")}] ` : "";
								const fullMessage = `${label}${issue.message}`;

								markers.push({
									startLineNumber: loc.line,
									startColumn: loc.column,
									endLineNumber: loc.line,
									endColumn: loc.column + (lastSeg !== undefined ? String(lastSeg).length + 2 : 2),
									message: fullMessage,
									severity: monacoInst.MarkerSeverity.Error,
								});

								if (!errorsByLine[loc.line]) errorsByLine[loc.line] = [];
								errorsByLine[loc.line].push(fullMessage);
							}
						}
					}
				} catch {}
			}

			// Apply native layout decorations directly to Monaco internal buffers
			monacoInst.editor.setModelMarkers(model, "json", markers);

			const newDecorations = Object.entries(errorsByLine).reduce((acc: any[], [lineStr, messages]) => {
				const line = parseInt(lineStr, 10);
				if (isNaN(line) || line < 1 || line > model.getLineCount()) return acc;
				const maxColumn = model.getLineMaxColumn(line);

				acc.push({
					range: new monacoInst.Range(line, maxColumn, line, maxColumn),
					options: {
						isWholeLine: true,
						className: "error-lens-line-background",
						after: {
							content: `  ● ${messages.join(" | ")}`,
							inlineClassName: "error-lens-text",
						},
					},
				});
				return acc;
			}, []);

			decorationIdsRef.current = editorInst.deltaDecorations(decorationIdsRef.current, newDecorations);
		};

		// ------------------------------------------------------------------
		// Native Property Synchronization
		// ------------------------------------------------------------------
		useEffect(() => {
			const editor = editorRef.current;
			if (!editor) return;

			if (editor.hasTextFocus()) return;

			const targetStr = value != null ? stringifyConfigJSON(value) : "";
			const currentStr = editor.getValue();

			const { parsed: currentObj } = parseJsonObject(currentStr);
			if (currentObj && stringifyConfigJSON(currentObj) === targetStr) {
				return;
			}

			isWritingRef.current = true;
			editor.setValue(targetStr);
			lastValidJsonRef.current = targetStr;
			isWritingRef.current = false;

			runNativeValidation(editor.getModel());
		}, [value]);

		useEffect(() => {
			if (editorRef.current) {
				runNativeValidation(editorRef.current.getModel());
			}
		}, [zodSchema]);

		useImperativeHandle(ref, () => ({
			format() {
				const editor = editorRef.current;
				if (!editor) return;
				const currentVal = editor.getValue();
				const { parsed } = parseJsonObject(currentVal);
				if (!parsed) return;
				const formatted = stringifyConfigJSON(parsed);

				if (formatted !== currentVal) {
					isWritingRef.current = true;
					editor.setValue(formatted);
					isWritingRef.current = false;
					runNativeValidation(editor.getModel());
					onChangeRef.current?.(parsed);
				}
			},
		}));

		const isInvalid = ariaProps["aria-invalid"] === true || ariaProps["aria-invalid"] === "true";

		return (
			<div
				id={ariaProps.id}
				aria-invalid={ariaProps["aria-invalid"]}
				aria-describedby={ariaProps["aria-describedby"]}
				className={cn(
					"rounded-lg border transition-colors",
					isInvalid ? "border-destructive" : "border-input",
					className,
				)}>
				<Editor
					height={height}
					defaultLanguage="json"
					defaultValue={initialJson}
					theme="vs-dark"
					onMount={(editor, monaco) => {
						editorRef.current = editor;
						monacoRef.current = monaco;

						const model = editor.getModel();

						monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: false });
						monaco.languages.json.jsonDefaults.setModeConfiguration({
							hovers: false,
							diagnostics: false,
						});

						if (model) {
							model.onDidChangeContent(() => {
								if (isWritingRef.current) return;

								const text = model.getValue();
								runNativeValidation(model);

								const { parsed, error } = parseJsonObject(text);
								if (!error && parsed) {
									const serialized = stringifyConfigJSON(parsed);
									if (serialized !== lastValidJsonRef.current) {
										lastValidJsonRef.current = serialized;
										onChangeRef.current?.(parsed);
									}
								} else if (text.trim() === "") {
									onChangeRef.current?.(undefined);
								}
							});
						}

						editor.onDidBlurEditorText(() => {
							onBlurRef.current?.();
							if (!model) return;

							const currentVal = model.getValue();
							const { parsed } = parseJsonObject(currentVal);
							if (parsed) {
								const formatted = stringifyConfigJSON(parsed);
								if (formatted !== currentVal) {
									isWritingRef.current = true;
									editor.setValue(formatted);
									isWritingRef.current = false;
									runNativeValidation(model);
									onChangeRef.current?.(parsed);
								}
							}
						});

						runNativeValidation(model);
					}}
					options={{
						minimap: { enabled: false },
						automaticLayout: true,
						fontSize: 14,
						fontFamily: "monospace",
						scrollBeyondLastLine: false,
						tabSize: 3,
						insertSpaces: true,
					}}
				/>
			</div>
		);
	},
);

ValidatedJsonEditor.displayName = "ValidatedJsonEditor";
export default ValidatedJsonEditor;
