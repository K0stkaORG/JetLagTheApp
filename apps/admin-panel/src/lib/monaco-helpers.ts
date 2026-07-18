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

/**
 * Walk a raw JSON string to find the line/column of the value at the given path.
 * Used to place Zod issue markers at the exact field location.
 */
export function findJsonPathPosition(
	json: string,
	path: (string | number)[],
): { line: number; column: number } {
	if (!path.length) return { line: 1, column: 1 };

	let pos = 0;
	let lastResolvedPos = 0; // Fallback to nearest parent resolved position

	const skipWs = () => {
		while (pos < json.length && /\s/.test(json[pos])) pos++;
	};

	const skipString = (): boolean => {
		if (json[pos] !== '"') return false;
		pos++;
		while (pos < json.length) {
			if (json[pos] === "\\") { pos += 2; continue; }
			if (json[pos] === '"') { pos++; return true; }
			pos++;
		}
		return false;
	};

	const skipValue = (): boolean => {
		skipWs();
		if (pos >= json.length) return false;
		const c = json[pos];
		if (c === '{') return skipObject();
		if (c === '[') return skipArray();
		if (c === '"') return skipString();
		if (c === 't') { pos += 4; return true; }
		if (c === 'f') { pos += 5; return true; }
		if (c === 'n') { pos += 4; return true; }
		while (pos < json.length && /[-\d.eE+]/.test(json[pos])) pos++;
		return true;
	};

	const skipObject = (): boolean => {
		if (json[pos] !== '{') return false;
		pos++;
		skipWs();
		if (json[pos] === '}') { pos++; return true; }
		while (pos < json.length) {
			skipWs();
			skipString();
			skipWs();
			if (json[pos] === ':') pos++;
			skipWs();
			skipValue();
			skipWs();
			if (json[pos] === '}') { pos++; return true; }
			if (json[pos] === ',') pos++;
		}
		return false;
	};

	const skipArray = (): boolean => {
		if (json[pos] !== '[') return false;
		pos++;
		skipWs();
		if (json[pos] === ']') { pos++; return true; }
		while (pos < json.length) {
			skipWs();
			if (json[pos] === ']') { pos++; return true; }
			skipValue();
			skipWs();
			if (json[pos] === ']') { pos++; return true; }
			if (json[pos] === ',') pos++;
		}
		return false;
	};

	const readKey = (): string | null => {
		skipWs();
		if (json[pos] !== '"') return null;
		pos++;
		let key = '';
		while (pos < json.length) {
			if (json[pos] === '\\') { pos++; key += json[pos++]; continue; }
			if (json[pos] === '"') { pos++; return key; }
			key += json[pos++];
		}
		return null;
	};

	const posToLineCol = (charPos: number) => {
		const before = json.substring(0, charPos);
		const lines = before.split('\n');
		return { line: lines.length, column: lines[lines.length - 1].length + 1 };
	};

	skipWs();

	for (let i = 0; i < path.length; i++) {
		const segment = path[i];
		skipWs();

		if (typeof segment === 'string') {
			if (json[pos] !== '{') return posToLineCol(lastResolvedPos);
			pos++;
			skipWs();
			let found = false;
			while (pos < json.length) {
				skipWs();
				if (json[pos] === '}') break;
				const keyStart = pos;
				const key = readKey();
				skipWs();
				if (json[pos] === ':') pos++;
				skipWs();
				if (key === segment) {
					lastResolvedPos = keyStart;
					if (i === path.length - 1) return posToLineCol(pos);
					found = true;
					break;
				}
				skipValue();
				skipWs();
				if (json[pos] === ',') pos++;
			}
			if (!found) return posToLineCol(lastResolvedPos);
		} else if (typeof segment === 'number') {
			if (json[pos] !== '[') return posToLineCol(lastResolvedPos);
			pos++;
			skipWs();
			for (let j = 0; j < segment; j++) {
				if (json[pos] === ']') return posToLineCol(lastResolvedPos);
				skipValue();
				skipWs();
				if (json[pos] === ',') pos++;
				skipWs();
			}
			lastResolvedPos = pos;
			if (i === path.length - 1) return posToLineCol(pos);
		}
	}

	return posToLineCol(lastResolvedPos);
}


