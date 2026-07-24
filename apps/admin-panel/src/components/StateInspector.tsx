import { MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface StateInspectorProps {
	state: unknown;
	geoJsonPaths?: Set<string>;
	onSelectPath?: (path: string) => void;
}

const STORAGE_KEY = "orchestrator_debug_expanded_v3";

/* ─── Scoped CSS ─────────────────────────────────────────────────────
   No <details>/<summary> — pure div-based tree with .open class.
   Arrow rotation, child visibility, and expand-hide are all CSS-only. */
const TREE_STYLES = `
/* Node structure */
.tree-node > .tree-children { display: none; }
.tree-node.open > .tree-children { display: block; }

/* Arrow */
.tree-node-arrow {
	display: inline-block;
	font-size: 8px;
	line-height: 1;
	width: 12px;
	text-align: center;
	color: #665c54;
	cursor: pointer;
	flex-shrink: 0;
	transition: transform 150ms ease, color 100ms ease;
	user-select: none;
}
.tree-node-arrow:hover { color: #a89984; }
.tree-node.open > .tree-row > .tree-node-arrow { transform: rotate(90deg); }

/* Hide expand-subtree button when open */
.tree-expand-hide { display: inline-flex; }
.tree-node.open > .tree-row > .tree-expand-hide { display: none; }

/* Action buttons */
.tree-action-btn {
	display: inline-flex; align-items: center; gap: 3px;
	cursor: pointer; border-radius: 3px;
	border: 1px solid #504945; background: #32302f;
	padding: 1px 6px; font-family: monospace; font-size: 9px; color: #928374;
	transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
	user-select: none; white-space: nowrap;
}
.tree-action-btn:hover { background: #3c3836; color: #ebdbb2; border-color: #665c54; }
.tree-action-btn:active { transform: scale(0.95); }

/* Map button */
.tree-map-btn {
	display: inline-flex; align-items: center; gap: 3px;
	cursor: pointer; border-radius: 3px;
	border: 1px solid rgba(250,189,47,0.35); background: transparent;
	padding: 1px 6px; font-family: monospace; font-size: 9px;
	color: rgba(250,189,47,0.6);
	transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
	user-select: none; white-space: nowrap;
}
.tree-map-btn:hover { background: rgba(250,189,47,0.12); color: #fabd2f; border-color: #fabd2f; }
.tree-map-btn:active { transform: scale(0.95); }

/* Row hover */
.tree-row { transition: background 80ms ease; }
.tree-row:hover { background: rgba(80,73,69,0.3); }
`;

/* ─── Helpers ───────────────────────────────────────────────────────── */

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

function formatDateStr(date: Date): { formatted: string; relative: string } {
	if (isNaN(date.getTime())) return { formatted: "Invalid Date", relative: "" };
	const formatted = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
	const diffMs = Date.now() - date.getTime();
	const diffSec = Math.floor(Math.abs(diffMs) / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHours = Math.floor(diffMin / 60);
	const diffDays = Math.floor(diffHours / 24);
	let relative = "just now";
	if (diffSec >= 5) {
		if (diffMs > 0) {
			if (diffSec < 60) relative = `${diffSec}s ago`;
			else if (diffMin < 60) relative = `${diffMin}m ago`;
			else if (diffHours < 24) relative = `${diffHours}h ago`;
			else relative = `${diffDays}d ago`;
		} else {
			if (diffSec < 60) relative = `in ${diffSec}s`;
			else if (diffMin < 60) relative = `in ${diffMin}m`;
			else if (diffHours < 24) relative = `in ${diffHours}h`;
			else relative = `in ${diffDays}d`;
		}
	}
	return { formatted, relative };
}

function renderPrimitiveValue(val: unknown) {
	if (val === null) return <span className="text-[#928374] italic">null</span>;
	if (val === undefined) return <span className="text-[#928374] italic">undefined</span>;
	if (typeof val === "string") {
		if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
			const d = new Date(val);
			if (!isNaN(d.getTime())) {
				const { formatted, relative } = formatDateStr(d);
				return (
					<span className="min-w-0 break-words">
						<span className="text-[#b8bb26]">{JSON.stringify(val)}</span>{" "}
						<span className="whitespace-nowrap text-[#928374] italic">({relative})</span>
					</span>
				);
			}
		}
		return <span className="min-w-0 break-words text-[#b8bb26]">{JSON.stringify(val)}</span>;
	}
	if (typeof val === "number") return <span className="text-[#d3869b]">{val}</span>;
	if (typeof val === "boolean") return <span className="text-[#fe8019]">{String(val)}</span>;
	if (typeof val === "symbol") return <span className="text-[#bdae93]">{String(val)}</span>;
	return <span className="min-w-0 break-words text-[#bdae93]">{String(val)}</span>;
}

function getStorage() {
	try {
		if (typeof localStorage !== "undefined") return localStorage;
	} catch {}
	try {
		if (typeof sessionStorage !== "undefined") return sessionStorage;
	} catch {}
	return null;
}

function loadSavedPaths(): Set<string> | null {
	const store = getStorage();
	if (!store) return null;
	try {
		const raw = store.getItem(STORAGE_KEY);
		if (raw !== null) return new Set(JSON.parse(raw));
		// eslint-disable-next-line no-empty
	} catch {}
	return null;
}

// eslint-disable-next-line react-refresh/only-export-components
export function saveOpenPaths() {
	const store = getStorage();
	if (!store) return;
	const openPaths: string[] = [];
	document.querySelectorAll(".tree-node[data-path]").forEach((el) => {
		if (el.classList.contains("open")) {
			const p = el.getAttribute("data-path");
			if (p) openPaths.push(p);
		}
	});
	try {
		store.setItem(STORAGE_KEY, JSON.stringify(openPaths));
	} catch {}
}

export function setNodeState(el: HTMLElement, isOpen: boolean) {
	if (isOpen) el.classList.add("open");
	else el.classList.remove("open");
}

function isGeoJsonValue(val: unknown): boolean {
	if (!val || typeof val !== "object") return false;
	const obj = val as Record<string, unknown>;
	const type = String(obj.type || "");
	if (
		["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection", "Feature", "FeatureCollection"].includes(type)
	) {
		return true;
	}
	if (Array.isArray(obj.coordinates) || Array.isArray(obj.features)) return true;
	return false;
}

// eslint-disable-next-line react-refresh/only-export-components
export function expandSubtreeNode(root: HTMLElement, isOpen: boolean) {
	if (root.classList.contains("tree-node")) {
		setNodeState(root, isOpen);
	}
	root.querySelectorAll(".tree-node[data-path]").forEach((el) => {
		setNodeState(el as HTMLElement, isOpen);
	});
	saveOpenPaths();
}

// eslint-disable-next-line react-refresh/only-export-components
export function setNodeStateAll(root: Document | HTMLElement, isOpen: boolean, skipGeoJson = true) {
	const isGeoNode = (el: HTMLElement) => {
		return el.getAttribute("data-geojson") === "true" || !!el.parentElement?.closest('.tree-node[data-geojson="true"]');
	};

	if (root instanceof HTMLElement && root.classList.contains("tree-node")) {
		if (!isOpen || !skipGeoJson || !isGeoNode(root)) {
			setNodeState(root, isOpen);
		}
	}
	root.querySelectorAll(".tree-node[data-path]").forEach((el) => {
		const nodeEl = el as HTMLElement;
		if (!isOpen || !skipGeoJson || !isGeoNode(nodeEl)) {
			setNodeState(nodeEl, isOpen);
		}
	});
	saveOpenPaths();
}

function isExpandable(val: unknown): boolean {
	return val !== null && typeof val === "object";
}

function getDisplayName(value: unknown): string {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (Array.isArray(value)) return "Array";
	if (typeof value === "object") {
		const obj = value as Record<string, unknown>;
		if (obj.__type__) return String(obj.__type__);
		if (typeof obj.type === "string" && obj.type) return String(obj.type);
		const name = (value as any).constructor?.name;
		return name && name !== "Object" ? name : "Object";
	}
	return typeof value;
}

function getObjectEntries(value: Record<string, unknown>): Array<[string, unknown]> {
	if (Array.isArray(value)) return value.map((item, i) => [String(i), item] as [string, unknown]);
	const entries: Array<[string, unknown]> = [];
	for (const [k, v] of Object.entries(value)) {
		if (k === "__type__") continue;
		if (typeof v === "function") continue;
		entries.push([k, v]);
	}
	return entries;
}

/* ─── TreeNode ────────────────────────────────────────────────────── */

const TreeNode = ({
	label,
	value,
	depth,
	path,
	geoJsonPaths,
	onSelectPath,
}: {
	label: string;
	value: unknown;
	depth: number;
	path: string;
	geoJsonPaths?: Set<string>;
	onSelectPath?: (path: string) => void;
}) => {
	const isGeoJsonObj = isGeoJsonValue(value);
	const isGeoJson = !!(geoJsonPaths?.has(path) || isGeoJsonObj);

	const mapBtn =
		geoJsonPaths && isGeoJson ? (
			<span
				role="button"
				tabIndex={0}
				className="tree-map-btn"
				onClick={(e) => {
					e.stopPropagation();
					onSelectPath?.(path);
				}}
				onKeyDown={(e) => e.key === "Enter" && onSelectPath?.(path)}>
				<MapPin className="size-2" /> map
			</span>
		) : null;

	/* ── Leaf / primitive ── */
	if (!isExpandable(value)) {
		return (
			<div className="tree-row flex items-baseline gap-1.5 overflow-hidden border-b border-[#3c3836]/40 px-2 py-0.5 font-mono text-xs last:border-b-0">
				<span className="w-3 shrink-0" />
				<span className="shrink-0 text-[#83a598]">{label}</span>
				<span className="shrink-0 text-[#928374]">:</span>
				<span className="min-w-0 flex-1 overflow-hidden">{renderPrimitiveValue(value)}</span>
				{mapBtn}
			</div>
		);
	}

	if (value === "[Circular]") {
		return (
			<div className="tree-row flex items-baseline gap-1 border-b border-[#3c3836]/40 px-2 py-0.5 font-mono text-xs last:border-b-0">
				<span className="w-3 shrink-0" />
				<span className="shrink-0 text-[#83a598]">{label}</span>
				<span className="shrink-0 text-[#928374]">:</span>
				<span className="text-[#fb4934] italic">[Circular]</span>
			</div>
		);
	}

	const entries = getObjectEntries(value as Record<string, unknown>);
	const displayName = getDisplayName(value);

	if (entries.length === 0) {
		return (
			<div className="tree-row flex items-baseline gap-1.5 overflow-hidden border-b border-[#3c3836]/40 px-2 py-0.5 font-mono text-xs last:border-b-0">
				<span className="w-3 shrink-0" />
				<span className="shrink-0 text-[#83a598]">{label}</span>
				<span className="shrink-0 text-[#928374]">:</span>
				<span className="shrink-0 text-[#928374] italic">{displayName} &#123;&#125;</span>
				{mapBtn}
			</div>
		);
	}

	/* ── Expandable node ── */
	const toggleSelf = (e: React.MouseEvent) => {
		const node = (e.currentTarget as HTMLElement).closest(".tree-node") as HTMLElement | null;
		if (node) {
			setNodeState(node, !node.classList.contains("open"));
			setTimeout(saveOpenPaths, 50);
		}
	};

	const expandSubtree = (e: React.MouseEvent) => {
		e.stopPropagation();
		const node = (e.currentTarget as HTMLElement).closest(".tree-node") as HTMLElement | null;
		if (node) {
			const isGeoTarget =
				node.getAttribute("data-geojson") === "true" || !!node.parentElement?.closest('.tree-node[data-geojson="true"]');
			if (isGeoTarget) {
				expandSubtreeNode(node, true);
			} else {
				setNodeStateAll(node, true, true);
			}
		}
	};

	return (
		<div
			className="tree-node border-b border-[#3c3836]/50 last:border-b-0"
			data-path={path}
			data-depth={depth}
			data-geojson={isGeoJson ? "true" : "false"}>
			<div className="tree-row flex cursor-default items-center gap-1.5 overflow-hidden px-2 py-0.5 font-mono text-xs text-[#ebdbb2] select-none">
				{/* Arrow — click only on arrow to toggle */}
				<span
					role="button"
					tabIndex={0}
					aria-label="Toggle"
					className="tree-node-arrow"
					onClick={toggleSelf}
					onKeyDown={(e) => e.key === "Enter" && toggleSelf(e as any)}>
					▶
				</span>
				<span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
					<span className="shrink-0 text-[#83a598]">{label}</span>
					<span className="shrink-0 text-[#928374]">:</span>
					<span className="shrink-0 text-[#8ec07c]">{displayName}</span>
					<span className="shrink-0 rounded-full bg-[#3c3836] px-1.5 py-0.5 font-mono text-[9px] leading-none text-[#928374]">
						{entries.length}
					</span>
				</span>
				{/* Expand subtree — hidden when open via CSS */}
				<span className="tree-expand-hide items-center gap-1">
					<span
						role="button"
						tabIndex={0}
						className="btn-sub-expand tree-action-btn"
						onClick={expandSubtree}
						onKeyDown={(e) => e.key === "Enter" && expandSubtree(e as any)}
						title="Expand subtree">
						Expand subtree
					</span>
				</span>
				{mapBtn}
			</div>
			<div className="tree-children ml-5 border-l border-[#504945]/60 bg-[#1d2021]/10 pl-1.5">
				{entries.map(([k, v]) => (
					<TreeNode
						key={k}
						label={k}
						value={v}
						depth={depth + 1}
						path={`${path}.${k}`}
						geoJsonPaths={geoJsonPaths}
						onSelectPath={onSelectPath}
					/>
				))}
			</div>
		</div>
	);
};

/* ─── StateInspector ─────────────────────────────────────────────── */

let stylesInjected = false;

export const StateInspector = ({ state, geoJsonPaths, onSelectPath }: StateInspectorProps) => {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		if (stylesInjected || document.getElementById("state-inspector-styles")) return;
		const style = document.createElement("style");
		style.id = "state-inspector-styles";
		style.textContent = TREE_STYLES;
		document.head.appendChild(style);
		stylesInjected = true;
	}, []);

	const initTree = useCallback(() => {
		const savedPaths = loadSavedPaths();
		document.querySelectorAll(".tree-node[data-path]").forEach((el) => {
			const node = el as HTMLElement;
			const path = node.getAttribute("data-path");
			const depth = node.getAttribute("data-depth");
			if (savedPaths === null) setNodeState(node, depth === "1");
			else setNodeState(node, !!(path && savedPaths.has(path)));
		});
		saveOpenPaths();
		setIsReady(true);
	}, []);

	useEffect(() => {
		initTree();
	}, [state, initTree]);

	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!target) return;

			// Global expand/collapse buttons in the toolbar
			if (target.closest("#btn-expand")) {
				setNodeStateAll(document, true);
			} else if (target.closest("#btn-collapse")) {
				setNodeStateAll(document, false);
			}
		};
		document.addEventListener("click", handleClick, true);
		return () => document.removeEventListener("click", handleClick, true);
	}, []);

	const rootEntries = isExpandable(state) ? getObjectEntries(state as Record<string, unknown>) : [];

	return (
		<div
			className={`root size-full overflow-hidden font-mono text-xs text-[#ebdbb2] ${isReady ? "visible" : "invisible"}`}>
			<div className="root-children h-full overflow-y-auto p-1">
				{rootEntries.map(([k, v]) => (
					<TreeNode
						key={k}
						label={k}
						value={v}
						depth={1}
						path={k}
						geoJsonPaths={geoJsonPaths}
						onSelectPath={onSelectPath}
					/>
				))}
			</div>
		</div>
	);
};
