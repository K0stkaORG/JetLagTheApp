import { IdMap } from "@jetlag/shared-types";
import { MapPin } from "lucide-react";
import {
	createContext,
	forwardRef,
	memo,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";

// ─── Public API ───────────────────────────────────────────────────────────────

interface StateInspectorProps {
	state: unknown;
	geoJsonPaths?: Set<string>;
	onSelectPath?: (path: string) => void;
}

export interface StateInspectorHandle {
	expandAll: () => void;
	collapseAll: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

/**
 * Signal sent from StateInspector to all mounted TreeNodes.
 * `id` monotonically increases so nodes can detect new signals even if
 * the signal parameters are the same as before.
 */
interface TreeSignal {
	/** null = match every node; non-null = only nodes at or under this path */
	targetPath: string | null;
	open: boolean;
	/** When true, nodes flagged as geoJson are left untouched */
	skipGeoJson: boolean;
	id: number;
}

interface TreeStaticCtxValue {
	geoJsonPaths: Set<string> | undefined;
	onSelectPath: ((path: string) => void) | undefined;
	expandSubtree: (path: string) => void;
}

/** Carries the mutable signal — updates trigger all TreeNode effects */
const TreeSignalCtx = createContext<TreeSignal | null>(null);

/** Carries stable callbacks — safe to memoize once */
const TreeStaticCtx = createContext<TreeStaticCtxValue>({
	geoJsonPaths: undefined,
	onSelectPath: undefined,
	expandSubtree: () => {},
});

// ─── CSS ──────────────────────────────────────────────────────────────────────

const TREE_STYLES = `
.tree-row { transition: background 80ms ease; }
.tree-row:hover { background: rgba(80,73,69,0.3); }

.tree-node-arrow {
	display: inline-block; font-size: 8px; line-height: 1; width: 12px;
	text-align: center; color: #665c54; cursor: pointer; flex-shrink: 0;
	transition: transform 150ms ease, color 100ms ease; user-select: none;
}
.tree-node-arrow:hover { color: #a89984; }

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
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateStr(date: Date): { relative: string } {
	if (isNaN(date.getTime())) return { relative: "" };
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
	return { relative };
}

function renderPrimitiveValue(val: unknown) {
	if (val === null) return <span className="text-[#928374] italic">null</span>;
	if (val === undefined) return <span className="text-[#928374] italic">undefined</span>;
	if (typeof val === "string") {
		if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
			const d = new Date(val);
			if (!isNaN(d.getTime())) {
				const { relative } = formatDateStr(d);
				return (
					<span className="min-w-0 wrap-break-word">
						<span className="text-[#b8bb26]">{JSON.stringify(val)}</span>{" "}
						<span className="whitespace-nowrap text-[#928374] italic">({relative})</span>
					</span>
				);
			}
		}
		return <span className="min-w-0 wrap-break-word text-[#b8bb26]">{JSON.stringify(val)}</span>;
	}
	if (typeof val === "number") return <span className="text-[#d3869b]">{val}</span>;
	if (typeof val === "boolean") return <span className="text-[#fe8019]">{String(val)}</span>;
	if (typeof val === "symbol") return <span className="text-[#bdae93]">{String(val)}</span>;
	return <span className="min-w-0 wrap-break-word text-[#bdae93]">{String(val)}</span>;
}

function isGeoJsonValue(val: unknown): boolean {
	if (!val || typeof val !== "object") return false;
	const obj = val as Record<string, unknown>;
	const type = String(obj.type || "");
	if (
		[
			"Point",
			"MultiPoint",
			"LineString",
			"MultiLineString",
			"Polygon",
			"MultiPolygon",
			"GeometryCollection",
			"Feature",
			"FeatureCollection",
		].includes(type)
	) {
		return true;
	}
	if (Array.isArray(obj.coordinates) || Array.isArray(obj.features)) return true;
	return false;
}

function isExpandable(val: unknown): boolean {
	return val !== null && typeof val === "object";
}

function getDisplayName(value: unknown): string {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (value instanceof IdMap) return "IdMap";
	if (Array.isArray(value)) return "Array";
	if (typeof value === "object") {
		const obj = value as Record<string, unknown>;
		if (obj.__type__) return String(obj.__type__);
		if (obj.__type) return String(obj.__type);
		if (typeof obj.type === "string" && obj.type) return String(obj.type);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const name = (value as any).constructor?.name;
		return name && name !== "Object" ? name : "Object";
	}
	return typeof value;
}

function getObjectEntries(value: Record<string, unknown>): Array<[string, unknown]> {
	if (value instanceof IdMap) {
		const entries: Array<[string, unknown]> = [];
		value.forEach((v, k) => {
			entries.push([String(k), v]);
		});
		return entries;
	}
	if (Array.isArray(value)) return value.map((item, i) => [String(i), item] as [string, unknown]);
	const entries: Array<[string, unknown]> = [];
	for (const [k, v] of Object.entries(value)) {
		if (k === "__type__" || k === "__type") continue;
		if (typeof v === "function") continue;
		entries.push([k, v]);
	}
	return entries;
}

// ─── TreeNode ─────────────────────────────────────────────────────────────────

interface TreeNodeProps {
	label: string;
	value: unknown;
	depth: number;
	path: string;
}

const TreeNode = memo(function TreeNode({ label, value, depth, path }: TreeNodeProps) {
	const { geoJsonPaths, onSelectPath, expandSubtree } = useContext(TreeStaticCtx);
	const signal = useContext(TreeSignalCtx);

	const isGeoJsonObj = isGeoJsonValue(value);
	const isGeoJson = !!(geoJsonPaths?.has(path) || isGeoJsonObj);

	const matchesSignal =
		signal &&
		signal.open &&
		(signal.targetPath === null || path === signal.targetPath || path.startsWith(signal.targetPath + ".")) &&
		!(signal.skipGeoJson && isGeoJson);

	// Default: open depth-1 nodes, or open if active signal matches this path
	const [isOpen, setIsOpen] = useState(depth === 1 || Boolean(matchesSignal));

	// Track last signal id processed
	const lastSignalId = useRef<number>(signal?.id ?? -1);

	// Respond to expand/collapse signals
	useEffect(() => {
		if (!signal || signal.id === lastSignalId.current) return;
		lastSignalId.current = signal.id;

		const matches =
			signal.targetPath === null || path === signal.targetPath || path.startsWith(signal.targetPath + ".");
		if (!matches) return;
		if (signal.skipGeoJson && isGeoJson) return;
		setIsOpen(signal.open);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [signal]);

	// Map-pin button (only in split view when geoJsonPaths is provided)
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
	return (
		<div className="border-b border-[#3c3836]/50 last:border-b-0">
			<div className="tree-row flex cursor-default items-center gap-1.5 overflow-hidden px-2 py-0.5 font-mono text-xs text-[#ebdbb2] select-none">
				<span
					role="button"
					tabIndex={0}
					aria-label="Toggle"
					className="tree-node-arrow"
					style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
					onClick={() => setIsOpen((o) => !o)}
					onKeyDown={(e) => e.key === "Enter" && setIsOpen((o) => !o)}>
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
				{/* Expand-subtree button — only shown when collapsed */}
				{!isOpen && (
					<span
						role="button"
						tabIndex={0}
						className="tree-action-btn"
						onClick={(e) => {
							e.stopPropagation();
							setIsOpen(true);
							expandSubtree(path);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								setIsOpen(true);
								expandSubtree(path);
							}
						}}
						title="Expand subtree">
						Expand subtree
					</span>
				)}
				{mapBtn}
			</div>

			{/* Children are only mounted when open — the core perf optimization */}
			{isOpen && (
				<div className="ml-5 border-l border-[#504945]/60 bg-[#1d2021]/10 pl-1.5">
					{entries.map(([k, v]) => (
						<TreeNode
							key={k}
							label={k}
							value={v}
							depth={depth + 1}
							path={`${path}.${k}`}
						/>
					))}
				</div>
			)}
		</div>
	);
});

// ─── StateInspector ───────────────────────────────────────────────────────────

let stylesInjected = false;

export const StateInspector = forwardRef<StateInspectorHandle, StateInspectorProps>(function StateInspector(
	{ state, geoJsonPaths, onSelectPath },
	ref,
) {
	const [signal, setSignal] = useState<TreeSignal | null>(null);
	const signalCounter = useRef(0);

	const sendSignal = useCallback((s: Omit<TreeSignal, "id">) => {
		setSignal({ ...s, id: ++signalCounter.current });
	}, []);

	// Expose expand/collapse to parent via ref
	useImperativeHandle(
		ref,
		() => ({
			expandAll: () => sendSignal({ targetPath: null, open: true, skipGeoJson: true }),
			collapseAll: () => sendSignal({ targetPath: null, open: false, skipGeoJson: false }),
		}),
		[sendSignal],
	);

	// expandSubtree: opens a specific subtree path (triggered from inside a TreeNode)
	const expandSubtree = useCallback(
		(path: string) => {
			sendSignal({ targetPath: path, open: true, skipGeoJson: true });
		},
		[sendSignal],
	);

	// Inject styles once
	useEffect(() => {
		if (stylesInjected || document.getElementById("state-inspector-styles")) return;
		const style = document.createElement("style");
		style.id = "state-inspector-styles";
		style.textContent = TREE_STYLES;
		document.head.appendChild(style);
		stylesInjected = true;
	}, []);

	// Stable context value — only changes when callbacks change
	const staticCtxValue = useMemo<TreeStaticCtxValue>(
		() => ({ geoJsonPaths, onSelectPath, expandSubtree }),
		[geoJsonPaths, onSelectPath, expandSubtree],
	);

	const rootEntries = useMemo(
		() => (isExpandable(state) ? getObjectEntries(state as Record<string, unknown>) : []),
		[state],
	);

	return (
		<TreeSignalCtx.Provider value={signal}>
			<TreeStaticCtx.Provider value={staticCtxValue}>
				<div className="size-full overflow-hidden font-mono text-xs text-[#ebdbb2]">
					<div className="h-full min-w-0 scrollbar-gutter-stable overflow-auto p-1">
						{rootEntries.map(([k, v]) => (
							<TreeNode
								key={k}
								label={k}
								value={v}
								depth={1}
								path={k}
							/>
						))}
					</div>
				</div>
			</TreeStaticCtx.Provider>
		</TreeSignalCtx.Provider>
	);
});
