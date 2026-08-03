/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { cn } from "@/lib/utils";
import L from "leaflet";
import { ChevronUp, Eye, EyeOff, Layers, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Gruvbox dark mode vibrant color palette for map features */
const FEATURE_PALETTE = [
	{ stroke: "#fe8019", fill: "#fe8019" }, // Orange
	{ stroke: "#b8bb26", fill: "#b8bb26" }, // Bright Green
	{ stroke: "#83a598", fill: "#83a598" }, // Blue/Teal
	{ stroke: "#d3869b", fill: "#d3869b" }, // Purple/Pink
	{ stroke: "#fabd2f", fill: "#fabd2f" }, // Yellow
	{ stroke: "#ea696c", fill: "#ea696c" }, // Red
	{ stroke: "#8ec07c", fill: "#8ec07c" }, // Aqua
	{ stroke: "#d79921", fill: "#d79921" }, // Gold
	{ stroke: "#458588", fill: "#458588" }, // Deep Blue
	{ stroke: "#b16286", fill: "#b16286" }, // Magenta
];

function getFeatureColor(index: number) {
	return FEATURE_PALETTE[index % FEATURE_PALETTE.length];
}

/** Priority for Z-index rendering order: MultiPolygon < Polygon < LineString < Point */
function getGeometryPriority(feature: any): number {
	const type = String(feature?.geometry?.type || "");
	switch (type) {
		case "MultiPolygon":
			return 1;
		case "Polygon":
			return 2;
		case "MultiLineString":
		case "LineString":
			return 3;
		case "Point":
		case "MultiPoint":
		case "CircleMarker":
			return 4;
		default:
			return 3;
	}
}

/** Get dedicated Leaflet Pane for geometry z-index ordering */
function getGeometryPane(feature: any): string {
	const type = String(feature?.geometry?.type || "");
	switch (type) {
		case "MultiPolygon":
			return "multiPolygonPane";
		case "Polygon":
			return "polygonPane";
		case "MultiLineString":
		case "LineString":
			return "linePane";
		case "Point":
		case "MultiPoint":
		case "CircleMarker":
			return "pointPane";
		default:
			return "linePane";
	}
}

/** Singularize + capitalize a collection name: "servers" → "Server" */
function singularize(word: string): string {
	const w = word.endsWith("s") ? word.slice(0, -1) : word;
	return w.charAt(0).toUpperCase() + w.slice(1);
}

/** Formatted path: "servers.idToObjectMap.89.Symbol(dataset).idk" → "Server(89).dataset.idk" */
function formatFormattedPath(path: string): string {
	return path
		.replace(/(\w+)\.(?:idToObjectMap|values)\.(\w+)/g, (_, col, id) => `${singularize(col)}(${id})`)
		.replace(/Symbol\(([^)]+)\)/g, "$1");
}

/** Normalize path for flexible comparison: strips idToObjectMap, values, and Symbol wrappers */
function normalizePath(path: string): string {
	return path
		.replace(/\.(?:idToObjectMap|values)\./g, ".")
		.replace(/^(?:idToObjectMap|values)\./, "")
		.replace(/Symbol\(([^)]+)\)/g, "$1");
}

/** Check if two paths match, accounting for unwrapped idToObjectMap / Symbol differences */
function isPathMatch(featPath: string, selPath?: string): boolean {
	if (!selPath || !featPath) return false;
	if (featPath === selPath) return true;
	const normFeat = normalizePath(featPath);
	const normSel = normalizePath(selPath);
	return normFeat === normSel || normFeat.endsWith("." + normSel) || normSel.endsWith("." + normFeat);
}

/** Insert zero-width spaces after dots so the browser can wrap there */
function wrapOnDots(s: string): string {
	return s.replace(/\./g, ".\u200B");
}

/**
 * Returns the array parent path for feature paths belonging to an array of features.
 * Supports both direct features (e.g. "districts.0") and single-property features of array items
 * (e.g. "districts.0.polygon" → "districts").
 *
 * Excludes IdMap key lookups (e.g. "questions.values.3" or "questions.idToObjectMap.3") which represent
 * distinct named/keyed entities (e.g. Question(3)) and should not be collapsed into anonymous array groups.
 */
function getGroupParentPath(path: string): string | null {
	const match = path.match(/^(.+)\.(\d+)(?:\.[^.]+)?$/);
	if (!match) return null;

	const parentPath = match[1];

	// If parent path ends in .idToObjectMap or .values, it's an IdMap key lookup, not an array index!
	if (/\.(?:idToObjectMap|values)$/i.test(parentPath)) {
		return null;
	}

	return parentPath;
}

const LEAFLET_POPUP_STYLES = `
.leaflet-popup .leaflet-popup-content-wrapper,
div.leaflet-popup-content-wrapper {
	background: #282828 !important;
	color: #ebdbb2 !important;
	border: 1px solid #504945 !important;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6) !important;
	border-radius: 6px !important;
	padding: 0 !important;
}
.leaflet-popup .leaflet-popup-content,
div.leaflet-popup-content {
	margin: 3px 12px 3px 5px !important;
	line-height: 1.2 !important;
	width: auto !important;
}
.leaflet-popup .leaflet-popup-tip-container {
	margin-top: -1px !important;
}
.leaflet-popup .leaflet-popup-tip {
	background: #282828 !important;
	border: 1px solid #504945 !important;
}
.leaflet-popup a.leaflet-popup-close-button,
.leaflet-container a.leaflet-popup-close-button {
	color: #928374 !important;
	font-size: 12px !important;
	top: 2px !important;
	right: 3px !important;
	width: 12px !important;
	height: 12px !important;
}
.leaflet-popup a.leaflet-popup-close-button:hover,
.leaflet-container a.leaflet-popup-close-button:hover {
	color: #fabd2f !important;
}
`;

interface LegendGroup {
	/** Null means this is a standalone feature, not a group */
	groupParentPath: string | null;
	/** Formatted name for the group or the single feature */
	name: string;
	/** All feature paths in this group (length === 1 for standalone) */
	paths: string[];
	/** Color index of the first item in the group */
	colorIndex: number;
}

interface FeatureItem {
	path: string;
	name: string;
	type: string;
	colorIndex: number;
}

interface GeoJsonMapProps {
	geoJson: {
		type: "FeatureCollection";
		features: any[];
	};
	selectedPath?: string;
	onSelectFeature?: (path: string) => void;
	showLegend?: boolean;
	/** When true, all features start hidden (map-only mode). Default false. */
	startAllHidden?: boolean;
	/** When true, only the selected feature is shown on the map (split-view mode). Default false. */
	isolateSelected?: boolean;
}

export const GeoJsonMap = ({
	geoJson,
	selectedPath,
	onSelectFeature,
	showLegend = true,
	startAllHidden = false,
	isolateSelected = false,
}: GeoJsonMapProps) => {
	const mapRef = useRef<HTMLDivElement>(null);
	const leafletMap = useRef<L.Map | null>(null);
	const geoJsonLayer = useRef<L.GeoJSON | null>(null);
	const featureLayersMap = useRef<Map<string, L.Layer>>(new Map());
	// Store per-layer style-setter for in-place style updates
	const layerStyleSetters = useRef<Map<string, (selected: boolean) => void>>(new Map());

	const [featuresList, setFeaturesList] = useState<FeatureItem[]>([]);
	const [hiddenPaths, setHiddenPaths] = useState<Set<string>>(new Set());
	const [legendCollapsed, setLegendCollapsed] = useState(false);

	// Search query (debounced)
	const [searchRaw, setSearchRaw] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleSearchChange = useCallback((value: string) => {
		setSearchRaw(value);
		if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
		searchDebounceRef.current = setTimeout(() => setSearchQuery(value), 150);
	}, []);

	// Inject Leaflet CSS + Custom Popup Theme
	useEffect(() => {
		const cssId = "leaflet-css";
		if (!document.getElementById(cssId)) {
			const link = document.createElement("link");
			link.id = cssId;
			link.rel = "stylesheet";
			link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
			document.head.appendChild(link);
		}

		const popupThemeId = "leaflet-dark-popup-styles";
		const existingStyle = document.getElementById(popupThemeId);
		if (existingStyle) {
			existingStyle.remove();
		}
		const style = document.createElement("style");
		style.id = popupThemeId;
		style.textContent = LEAFLET_POPUP_STYLES;
		document.head.appendChild(style);
	}, []);

	// Initialize Map
	useEffect(() => {
		if (!mapRef.current || leafletMap.current) return;

		const map = L.map(mapRef.current, {
			center: [0, 0],
			zoom: 5,
			zoomControl: true,
		});

		// Dedicated Z-index panes (MultiPolygon: 410 < Polygon: 420 < Line: 430 < Point: 440)
		map.createPane("multiPolygonPane");
		if (map.getPane("multiPolygonPane")) map.getPane("multiPolygonPane")!.style.zIndex = "410";

		map.createPane("polygonPane");
		if (map.getPane("polygonPane")) map.getPane("polygonPane")!.style.zIndex = "420";

		map.createPane("linePane");
		if (map.getPane("linePane")) map.getPane("linePane")!.style.zIndex = "430";

		map.createPane("pointPane");
		if (map.getPane("pointPane")) map.getPane("pointPane")!.style.zIndex = "440";

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
		}).addTo(map);

		leafletMap.current = map;

		return () => {
			map.remove();
			leafletMap.current = null;
		};
	}, []);

	// Update Features Layer
	useEffect(() => {
		const map = leafletMap.current;
		if (!map) return;

		if (geoJsonLayer.current) {
			map.removeLayer(geoJsonLayer.current);
			geoJsonLayer.current = null;
		}
		featureLayersMap.current.clear();
		layerStyleSetters.current.clear();

		if (!geoJson || !geoJson.features || geoJson.features.length === 0) {
			setFeaturesList([]);
			return;
		}

		const sortedFeatures = [...geoJson.features].sort((a, b) => getGeometryPriority(a) - getGeometryPriority(b));
		sortedFeatures.forEach((feat: any, idx: number) => {
			if (!feat.properties) feat.properties = {};
			feat.properties.__colorIndex = idx;
		});
		const list: FeatureItem[] = [];

		let featIndex = 0;
		const layer = L.geoJSON({ type: "FeatureCollection", features: sortedFeatures } as any, {
			style: (feature) => {
				const isSelected = isPathMatch(feature?.properties?.path, selectedPath);
				const color = getFeatureColor(feature?.properties?.__colorIndex ?? 0);
				const paneName = getGeometryPane(feature);
				return {
					pane: paneName,
					color: color.stroke,
					weight: isSelected ? 4 : 2.5,
					opacity: isSelected ? 1 : 0.9,
					fillColor: color.fill,
					fillOpacity: isSelected ? 0.35 : 0.15,
				};
			},
			pointToLayer: (feature, latlng) => {
				const isSelected = isPathMatch(feature?.properties?.path, selectedPath);
				const color = getFeatureColor(feature?.properties?.__colorIndex ?? 0);
				const paneName = getGeometryPane(feature);
				return L.circleMarker(latlng, {
					pane: paneName,
					radius: isSelected ? 9 : 7,
					fillColor: color.fill,
					color: isSelected ? "#ffffff" : "#1d2021",
					weight: isSelected ? 3 : 2,
					opacity: 1,
					fillOpacity: 0.9,
				});
			},
			onEachFeature: (feature, featureLayer) => {
				const colorIdx = featIndex++;
				if (feature.properties) {
					feature.properties.__colorIndex = colorIdx;
				}

				const props = feature.properties || {};
				const path = props.path || "Feature";
				const formattedName = formatFormattedPath(path);
				const geomType = String(feature.geometry?.type || "Feature");
				const color = getFeatureColor(colorIdx);

				list.push({ path, name: formattedName, type: geomType, colorIndex: colorIdx });
				featureLayersMap.current.set(path, featureLayer);
				featureLayersMap.current.set(normalizePath(path), featureLayer);

				// Style setter for in-place style updates (avoids full layer rebuild on selection change)
				const applyStyle = (isSelected: boolean) => {
					if ("setStyle" in featureLayer && typeof (featureLayer as any).setStyle === "function") {
						(featureLayer as any).setStyle({
							color: color.stroke,
							weight: isSelected ? 4 : 2.5,
							opacity: isSelected ? 1 : 0.9,
							fillColor: color.fill,
							fillOpacity: isSelected ? 0.35 : 0.15,
						});
					} else if (featureLayer instanceof L.CircleMarker) {
						featureLayer.setStyle({
							radius: isSelected ? 9 : 7,
							fillColor: color.fill,
							color: isSelected ? "#ffffff" : "#1d2021",
							weight: isSelected ? 3 : 2,
						} as any);
					}
				};
				layerStyleSetters.current.set(path, applyStyle);
				layerStyleSetters.current.set(normalizePath(path), applyStyle);

				const extraEntries = Object.entries(props).filter(
					([k]) => k !== "path" && k !== "name" && k !== "__colorIndex",
				);

				const popupContent = `
					<div style="font-family: monospace; font-size: 11px; color: #ebdbb2; max-width: 380px;">
						<strong style="color: #fabd2f; font-size: 11px; white-space: nowrap;">${formattedName}</strong>
						<div style="color: #83a598; font-size: 9px; margin-top: 1px; word-break: break-all;">${path}</div>
						${
							extraEntries.length > 0
								? `
						<hr style="border-color: #504945; margin: 4px 0;" />
						<div style="max-height: 100px; overflow-y: auto;">
							${extraEntries.map(([k, v]) => `<div><span style="color:#8ec07c">${k}</span>: ${JSON.stringify(v)}</div>`).join("")}
						</div>
					`
								: ""
						}
					</div>
				`;

				featureLayer.bindPopup(popupContent);

				featureLayer.bindTooltip(formattedName, {
					permanent: false,
					direction: "top",
					className:
						"bg-[#282828] text-[#fabd2f] font-mono text-[10px] px-1.5 py-0.5 rounded border border-[#504945] shadow-md",
				});

				featureLayer.on("click", () => {
					if (path) onSelectFeature?.(path);
				});
			},
		}).addTo(map);

		geoJsonLayer.current = layer;
		setFeaturesList(list);

		// Initialize hidden paths
		if (startAllHidden) {
			const all = new Set<string>();
			for (const item of list) {
				all.add(item.path);
				all.add(normalizePath(item.path));
			}
			setHiddenPaths(all);
		} else {
			setHiddenPaths(new Set());
		}

		try {
			const bounds = layer.getBounds();
			if (bounds.isValid()) {
				map.fitBounds(bounds, { padding: [40, 40] });
			}
		} catch {}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [geoJson]);

	// Update styles in-place when selectedPath changes (no layer rebuild)
	const prevSelectedPath = useRef<string | undefined>(undefined);
	useEffect(() => {
		// Deselect previous
		if (prevSelectedPath.current) {
			const setter =
				layerStyleSetters.current.get(prevSelectedPath.current) ||
				layerStyleSetters.current.get(normalizePath(prevSelectedPath.current));
			setter?.(false);
		}
		// Select new
		if (selectedPath) {
			const setter =
				layerStyleSetters.current.get(selectedPath) ||
				layerStyleSetters.current.get(normalizePath(selectedPath));
			if (!setter) {
				// Fallback: fuzzy match
				for (const [p, s] of layerStyleSetters.current.entries()) {
					if (isPathMatch(p, selectedPath)) {
						s(true);
						break;
					}
				}
			} else {
				setter(true);
			}
		}
		prevSelectedPath.current = selectedPath;
	}, [selectedPath]);

	// Handle visibility: isolateSelected mode (split view) or manual toggles (map mode)
	useEffect(() => {
		const map = leafletMap.current;
		if (!map) return;

		for (const item of featuresList) {
			const layer =
				featureLayersMap.current.get(item.path) || featureLayersMap.current.get(normalizePath(item.path));
			if (!layer) continue;

			let shouldHide: boolean;

			if (isolateSelected) {
				// In isolate mode: show only the selected feature (or all if nothing selected)
				if (selectedPath) {
					shouldHide = !isPathMatch(item.path, selectedPath);
				} else {
					shouldHide = true; // Nothing selected → hide everything
				}
			} else {
				// Normal mode: respect manual hiddenPaths
				shouldHide = hiddenPaths.has(item.path) || hiddenPaths.has(normalizePath(item.path));
			}

			if (shouldHide) {
				if (map.hasLayer(layer)) map.removeLayer(layer);
			} else {
				if (!map.hasLayer(layer)) map.addLayer(layer);
			}
		}
	}, [hiddenPaths, featuresList, isolateSelected, selectedPath]);

	// Focus map on selected path
	useEffect(() => {
		if (!selectedPath || !leafletMap.current) return;

		let targetLayer: L.Layer | undefined = featureLayersMap.current.get(selectedPath);
		if (!targetLayer) {
			targetLayer = featureLayersMap.current.get(normalizePath(selectedPath));
		}
		if (!targetLayer) {
			for (const [p, layer] of featureLayersMap.current.entries()) {
				if (isPathMatch(p, selectedPath)) {
					targetLayer = layer;
					break;
				}
			}
		}

		if (targetLayer) {
			const map = leafletMap.current;
			if (!map.hasLayer(targetLayer)) {
				map.addLayer(targetLayer);
			}

			if ("bringToFront" in targetLayer && typeof (targetLayer as any).bringToFront === "function") {
				(targetLayer as any).bringToFront();
			}

			if ("getBounds" in targetLayer && typeof (targetLayer as any).getBounds === "function") {
				const b = (targetLayer as any).getBounds();
				if (b && b.isValid && b.isValid()) {
					map.fitBounds(b, { padding: [60, 60], maxZoom: 16 });
				}
			} else if ("getLatLng" in targetLayer && typeof (targetLayer as any).getLatLng === "function") {
				map.setView((targetLayer as any).getLatLng(), 15);
			}
			if ("openPopup" in targetLayer && typeof (targetLayer as any).openPopup === "function") {
				(targetLayer as any).openPopup();
			}
		}
	}, [selectedPath]);

	// ── Legend grouping: collapse numeric-indexed array siblings into groups ──

	const legendGroups = useMemo<LegendGroup[]>(() => {
		const groups: LegendGroup[] = [];
		const addedParents = new Set<string>();

		for (const item of featuresList) {
			const parent = getGroupParentPath(item.path);
			if (parent) {
				if (addedParents.has(parent)) continue; // Already added this group
				addedParents.add(parent);
				const siblings = featuresList.filter((f) => getGroupParentPath(f.path) === parent);
				groups.push({
					groupParentPath: parent,
					name: formatFormattedPath(parent),
					paths: siblings.map((s) => s.path),
					colorIndex: siblings[0]?.colorIndex ?? 0,
				});
			} else {
				groups.push({
					groupParentPath: null,
					name: item.name,
					paths: [item.path],
					colorIndex: item.colorIndex,
				});
			}
		}
		return groups;
	}, [featuresList]);

	// Filtered legend groups by search query
	const filteredGroups = useMemo<LegendGroup[]>(() => {
		if (!searchQuery.trim()) return legendGroups;
		const q = searchQuery.toLowerCase();
		return legendGroups.filter((g) => g.name.toLowerCase().includes(q));
	}, [legendGroups, searchQuery]);

	// ── Visibility helpers ────────────────────────────────────────────────────

	const isGroupHidden = useCallback(
		(paths: string[]): boolean => {
			return paths.every((p) => hiddenPaths.has(p) || hiddenPaths.has(normalizePath(p)));
		},
		[hiddenPaths],
	);

	const isGroupPartiallyHidden = useCallback(
		(paths: string[]): boolean => {
			const hidden = paths.filter((p) => hiddenPaths.has(p) || hiddenPaths.has(normalizePath(p)));
			return hidden.length > 0 && hidden.length < paths.length;
		},
		[hiddenPaths],
	);

	const toggleGroupVisibility = useCallback((paths: string[]) => {
		setHiddenPaths((prev) => {
			const next = new Set(prev);
			const allHidden = paths.every((p) => prev.has(p) || prev.has(normalizePath(p)));
			for (const p of paths) {
				if (allHidden) {
					next.delete(p);
					next.delete(normalizePath(p));
				} else {
					next.add(p);
					next.add(normalizePath(p));
				}
			}
			return next;
		});
	}, []);

	const focusGroup = useCallback((paths: string[]) => {
		// Reveal group/item if hidden
		setHiddenPaths((prev) => {
			const next = new Set(prev);
			for (const p of paths) {
				next.delete(p);
				next.delete(normalizePath(p));
			}
			return next;
		});

		const map = leafletMap.current;
		if (!map) return;

		const latLngs: L.LatLng[] = [];
		let firstLayer: L.Layer | undefined;

		for (const p of paths) {
			const layer = featureLayersMap.current.get(p) || featureLayersMap.current.get(normalizePath(p));
			if (!layer) continue;
			if (!firstLayer) firstLayer = layer;

			if ("getBounds" in layer && typeof (layer as any).getBounds === "function") {
				const b = (layer as any).getBounds() as L.LatLngBounds;
				if (b?.isValid?.()) {
					latLngs.push(b.getNorthEast(), b.getSouthWest());
				}
			} else if ("getLatLng" in layer && typeof (layer as any).getLatLng === "function") {
				latLngs.push((layer as any).getLatLng());
			}
		}

		if (latLngs.length > 0) {
			const bounds = L.latLngBounds(latLngs);
			if (bounds.isValid()) {
				map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
			}
		}

		if (firstLayer && "openPopup" in firstLayer && typeof (firstLayer as any).openPopup === "function") {
			(firstLayer as any).openPopup();
		}
	}, []);

	const toggleAllVisibility = useCallback(() => {
		const anyVisible = featuresList.some(
			(f) => !hiddenPaths.has(f.path) && !hiddenPaths.has(normalizePath(f.path)),
		);
		if (anyVisible) {
			// Hide all
			const all = new Set<string>();
			for (const f of featuresList) {
				all.add(f.path);
				all.add(normalizePath(f.path));
			}
			setHiddenPaths(all);
		} else {
			// Show all
			setHiddenPaths(new Set());
		}
	}, [featuresList, hiddenPaths]);

	const hideAll = useCallback(() => {
		const all = new Set<string>();
		for (const f of featuresList) {
			all.add(f.path);
			all.add(normalizePath(f.path));
		}

		setHiddenPaths(all);
	}, [featuresList]);

	const someHidden =
		featuresList.length > 0 &&
		featuresList.some((f) => hiddenPaths.has(f.path) || hiddenPaths.has(normalizePath(f.path)));

	// ── Windowed rendering for large legend lists ──────────────────────────────
	const LEGEND_WINDOW_SIZE = 80;
	const [legendOffset, setLegendOffset] = useState(0);
	const legendScrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setLegendOffset(0);
	}, [searchQuery]);

	const visibleGroups = useMemo(() => {
		return filteredGroups.slice(legendOffset, legendOffset + LEGEND_WINDOW_SIZE);
	}, [filteredGroups, legendOffset]);

	const handleLegendScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			const el = e.currentTarget;
			const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
			const nearTop = el.scrollTop < 80;
			if (nearBottom && legendOffset + LEGEND_WINDOW_SIZE < filteredGroups.length) {
				setLegendOffset((o) => o + 20);
			}
			if (nearTop && legendOffset > 0) {
				setLegendOffset((o) => Math.max(0, o - 20));
			}
		},
		[legendOffset, filteredGroups.length],
	);

	return (
		<div className="relative size-full overflow-hidden bg-[#1d2021]">
			{showLegend && featuresList.length > 0 && (
				<div className="absolute top-3 right-3 z-10 flex max-h-[70%] max-w-xs flex-col overflow-hidden rounded-sm border border-[#504945] bg-[#282828]/95 font-mono text-xs text-[#ebdbb2] shadow-xl backdrop-blur-xs">
					{/* Sticky header */}
					<div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#504945] px-2 py-1.5 font-mono text-[11px] font-bold text-[#fabd2f]">
						<div className="flex cursor-pointer items-center gap-1.5 select-none">
							<Layers className="size-3.5" />
							Legend
						</div>
						<div className="flex items-center gap-2">
							{!legendCollapsed && (
								<button
									type="button"
									onClick={toggleAllVisibility}
									title={someHidden ? "Show All Features" : "Hide All Features"}
									className="flex cursor-pointer items-center gap-1 rounded border border-[#504945] bg-[#32302f] px-1.5 py-0.5 text-[10px] font-normal text-[#bdae93] transition-colors hover:bg-[#3c3836] hover:text-[#fabd2f]">
									{someHidden ? (
										<EyeOff className="size-3 text-[#ea696c]" />
									) : (
										<Eye className="size-3 text-[#8ec07c]" />
									)}
									{someHidden ? "Show All" : "Hide All"}
								</button>
							)}
							<button
								type="button"
								className="ml-0.5 text-[#928374] hover:text-[#ebdbb2]"
								onClick={() => setLegendCollapsed(!legendCollapsed)}>
								<ChevronUp
									className={cn("size-3.5 transition-transform", {
										"rotate-180": legendCollapsed,
									})}
								/>
							</button>
						</div>
					</div>

					{!legendCollapsed && (
						<>
							{/* Search box */}
							<div className="relative shrink-0 border-b border-[#504945] px-2 py-1.5">
								<Search className="absolute top-1/2 left-3.5 size-3 -translate-y-1/2 text-[#665c54]" />
								<input
									type="text"
									value={searchRaw}
									onChange={(e) => handleSearchChange(e.target.value)}
									placeholder="Search features…"
									className="w-full rounded border border-[#504945] bg-[#1d2021] py-0.5 pr-6 pl-6 font-mono text-[10px] text-[#ebdbb2] placeholder-[#504945] outline-none focus:border-[#4edebe]/50"
								/>
								{searchRaw && (
									<button
										type="button"
										onClick={() => handleSearchChange("")}
										className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[#665c54] hover:text-[#ebdbb2]">
										<X className="size-3" />
									</button>
								)}
							</div>

							{/* Scrollable list — windowed */}
							<div
								ref={legendScrollRef}
								className="space-y-0.5 overflow-y-auto p-1.5"
								onScroll={handleLegendScroll}>
								{filteredGroups.length === 0 && (
									<div className="px-2 py-2 text-center text-[10px] text-[#665c54] italic">
										No results
									</div>
								)}
								{/* Top padding spacer for windowing */}
								{legendOffset > 0 && <div style={{ height: legendOffset * 28 }} />}

								{visibleGroups.map((group) => {
									const isGroup = group.paths.length > 1;
									const groupHidden = isGroupHidden(group.paths);
									const groupPartial = isGroupPartiallyHidden(group.paths);
									const isSelected = group.paths.some((p) => isPathMatch(p, selectedPath));
									const color = getFeatureColor(group.colorIndex);

									return (
										<div
											key={group.groupParentPath ?? group.paths[0]}
											onClick={(e) => {
												e.stopPropagation();
												toggleGroupVisibility(group.paths);
												if (groupHidden) focusGroup(group.paths);
											}}
											onDoubleClick={(e) => {
												e.stopPropagation();
												hideAll();
												toggleGroupVisibility(group.paths);
												focusGroup(group.paths);
											}}
											className={`group flex cursor-pointer items-center justify-between rounded px-1.5 py-1 transition-colors hover:bg-[#3c3836] ${
												isSelected ? "border border-[#fabd2f] bg-[#3c3836]" : ""
											} ${groupHidden ? "opacity-45" : ""}`}>
											<div className="flex min-w-0 items-center gap-1.5">
												{/* Color Indicator Swatch */}
												<span
													className="size-2.5 shrink-0 rounded-full border border-[#1d2021] shadow-xs"
													style={{ backgroundColor: color.stroke }}
												/>
												<div className="flex min-w-0 flex-col">
													<span
														className={`font-mono text-xs font-semibold wrap-break-word ${
															groupHidden ? "text-[#928374] line-through" : ""
														}`}
														style={{ color: groupHidden ? undefined : color.stroke }}>
														{wrapOnDots(group.name)}
														{isGroup && (
															<span className="ml-1 rounded-full bg-[#3c3836] px-1.5 py-0.5 font-mono text-[9px] leading-none text-[#928374]">
																{group.paths.length}
															</span>
														)}
													</span>
													{!isGroup && (
														<span className="text-[10px] leading-tight wrap-break-word text-[#83a598]">
															{wrapOnDots(group.paths[0])}
														</span>
													)}
												</div>
											</div>

											{/* Visibility Eye Toggle */}
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													toggleGroupVisibility(group.paths);
												}}
												title={groupHidden ? "Show on map" : "Hide from map"}
												className="ml-1.5 shrink-0 rounded p-1 text-[#928374] transition-colors hover:bg-[#504945] hover:text-[#ebdbb2]">
												{groupHidden || groupPartial ? (
													<EyeOff
														className={`size-3.5 ${groupPartial ? "text-[#d79921]" : "text-[#ea696c]"}`}
													/>
												) : (
													<Eye className="size-3.5 text-[#8ec07c]" />
												)}
											</button>
										</div>
									);
								})}

								{/* Bottom padding spacer for windowing */}
								{legendOffset + LEGEND_WINDOW_SIZE < filteredGroups.length && (
									<div
										style={{
											height: (filteredGroups.length - legendOffset - LEGEND_WINDOW_SIZE) * 28,
										}}
									/>
								)}
							</div>
						</>
					)}
				</div>
			)}

			<div
				ref={mapRef}
				className="z-0 size-full overflow-hidden"
			/>
		</div>
	);
};
