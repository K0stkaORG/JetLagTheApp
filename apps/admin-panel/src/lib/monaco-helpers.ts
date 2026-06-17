export function getPositionFromJsonError(
	json: string,
	error: Error,
): { line: number; column: number } {
	const match = error.message.match(/position (\d+)/);
	if (match) {
		const pos = parseInt(match[1], 10);
		let line = 1;
		let column = 1;
		for (let i = 0; i < pos && i < json.length; i++) {
			if (json[i] === "\n") {
				line++;
				column = 1;
			} else {
				column++;
			}
		}
		return { line, column };
	}
	return { line: 1, column: 1 };
}

export function getFirstErrorMessage(error: any): string {
	if (!error) return "";
	if (error.message) return String(error.message);
	for (const key of Object.keys(error)) {
		if (key === "message" || key === "type") continue;
		const msg = getFirstErrorMessage(error[key]);
		if (msg) return msg;
	}
	return "Invalid value";
}

export function updateEditorMarkers(monaco: any, editor: any, json: string, fieldError: any) {
	if (!monaco || !editor) return;
	const model = editor.getModel();
	if (!model) return;

	let syntaxError: Error | null = null;
	try {
		const parsed = JSON.parse(json);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			syntaxError = new Error("Value must be a JSON object");
		}
	} catch (e) {
		syntaxError = e instanceof Error ? e : new Error("Invalid JSON");
	}

	if (syntaxError) {
		const pos = getPositionFromJsonError(json, syntaxError);
		monaco.editor.setModelMarkers(model, "owner", [
			{
				startLineNumber: pos.line,
				startColumn: pos.column,
				endLineNumber: pos.line,
				endColumn: pos.column + 1,
				message: syntaxError.message,
				severity: monaco.MarkerSeverity?.Error ?? 8,
			},
		]);
		return;
	}

	monaco.editor.setModelMarkers(model, "owner", []);

	if (fieldError) {
		const message = getFirstErrorMessage(fieldError);
		monaco.editor.setModelMarkers(model, "owner", [
			{
				startLineNumber: 1,
				startColumn: 1,
				endLineNumber: 1,
				endColumn: 2,
				message,
				severity: monaco.MarkerSeverity?.Error ?? 8,
			},
		]);
	}
}
