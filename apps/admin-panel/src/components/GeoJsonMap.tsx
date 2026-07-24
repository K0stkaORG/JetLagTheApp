import L from "leaflet";
import { Eye, EyeOff, Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
		.replace(/(\w+)\.idToObjectMap\.(\w+)/g, (_, col, id) => `${singularize(col)}(${id})`)
		.replace(/Symbol\(([^)]+)\)/g, "$1");
}

/** Normalize path for flexible comparison: strips idToObjectMap and Symbol wrappers */
function normalizePath(path: string): string {
	return path
		.replace(/\.idToObjectMap\./g, ".")
		.replace(/^idToObjectMap\./, "")
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

interface GeoJsonMapProps {
	geoJson: {
		type: "FeatureCollection";
		features: any[];
	};
	selectedPath?: string;
	onSelectFeature?: (path: string) => void;
	showLegend?: boolean;
}

export const GeoJsonMap = ({ geoJson, selectedPath, onSelectFeature, showLegend = true }: GeoJsonMapProps) => {
	const mapRef = useRef<HTMLDivElement>(null);
	const leafletMap = useRef<L.Map | null>(null);
	const geoJsonLayer = useRef<L.GeoJSON | null>(null);
	const featureLayersMap = useRef<Map<string, L.Layer>>(new Map());

	const [featuresList, setFeaturesList] = useState<
		Array<{ path: string; name: string; type: string; colorIndex: number }>
	>([]);
	const [hiddenPaths, setHiddenPaths] = useState<Set<string>>(new Set());

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
			center: [51.505, -0.09],
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

	// Update Features Layer with Geometry Priority Z-Ordering (MultiPolygon < Polygon < Line < Point)
	useEffect(() => {
		const map = leafletMap.current;
		if (!map) return;

		if (geoJsonLayer.current) {
			map.removeLayer(geoJsonLayer.current);
			geoJsonLayer.current = null;
		}
		featureLayersMap.current.clear();

		if (!geoJson || !geoJson.features || geoJson.features.length === 0) {
			setFeaturesList([]);
			return;
		}

		const sortedFeatures = [...geoJson.features].sort((a, b) => getGeometryPriority(a) - getGeometryPriority(b));
		const list: Array<{ path: string; name: string; type: string; colorIndex: number }> = [];

		let featIndex = 0;
		const layer = L.geoJSON({ type: "FeatureCollection", features: sortedFeatures } as any, {
			style: (feature) => {
				const isSelected = isPathMatch(feature?.properties?.path, selectedPath);
				const color = getFeatureColor(feature?.properties?.__colorIndex ?? 0);
				const paneName = getGeometryPane(feature);
				return {
					pane: paneName,
					color: isSelected ? "#fabd2f" : color.stroke,
					weight: isSelected ? 4 : 2.5,
					opacity: isSelected ? 1 : 0.9,
					fillColor: isSelected ? "#fe8019" : color.fill,
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
					fillColor: isSelected ? "#fabd2f" : color.fill,
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

				list.push({ path, name: formattedName, type: geomType, colorIndex: colorIdx });
				featureLayersMap.current.set(path, featureLayer);
				featureLayersMap.current.set(normalizePath(path), featureLayer);

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

				// Hover tooltip (non-permanent so it doesn't collide with popups)
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

		try {
			const bounds = layer.getBounds();
			if (bounds.isValid()) {
				map.fitBounds(bounds, { padding: [40, 40] });
			}
		} catch {}
	}, [geoJson]);

	// Handle feature visibility toggles
	useEffect(() => {
		const map = leafletMap.current;
		if (!map) return;

		for (const item of featuresList) {
			const layer =
				featureLayersMap.current.get(item.path) || featureLayersMap.current.get(normalizePath(item.path));
			if (!layer) continue;

			const isHidden = hiddenPaths.has(item.path) || hiddenPaths.has(normalizePath(item.path));
			if (isHidden) {
				if (map.hasLayer(layer)) {
					map.removeLayer(layer);
				}
			} else {
				if (!map.hasLayer(layer)) {
					map.addLayer(layer);
				}
			}
		}
	}, [hiddenPaths, featuresList]);

	// Automatically focus map on selectedPath changes & bring target layer to front
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

			// Bring active layer to front if possible
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

	const focusFeature = (path: string) => {
		onSelectFeature?.(path);
	};

	const toggleFeatureVisibility = (path: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setHiddenPaths((prev) => {
			const next = new Set(prev);
			const norm = normalizePath(path);
			if (next.has(path) || next.has(norm)) {
				next.delete(path);
				next.delete(norm);
			} else {
				next.add(path);
				next.add(norm);
			}
			return next;
		});
	};

	const toggleAllVisibility = () => {
		if (hiddenPaths.size > 0) {
			setHiddenPaths(new Set());
		} else {
			const all = new Set<string>();
			for (const f of featuresList) {
				all.add(f.path);
				all.add(normalizePath(f.path));
			}
			setHiddenPaths(all);
		}
	};

	const someHidden =
		featuresList.length > 0 &&
		featuresList.some((f) => hiddenPaths.has(f.path) || hiddenPaths.has(normalizePath(f.path)));

	return (
		<div className="relative size-full overflow-hidden rounded-[8px] border border-[#504945] bg-[#1d2021] shadow-2xl">
			<div
				ref={mapRef}
				className="z-0 size-full"
			/>

			{showLegend && featuresList.length > 0 && (
				<div className="absolute top-3 right-3 z-10 flex max-h-64 max-w-xs flex-col overflow-hidden rounded-lg border border-[#504945] bg-[#282828]/95 font-mono text-xs text-[#ebdbb2] shadow-xl backdrop-blur-xs">
					{/* Sticky header */}
					<div className="flex flex-shrink-0 items-center justify-between border-b border-[#504945] px-2 py-1.5 font-mono text-[11px] font-bold text-[#fabd2f]">
						<div className="flex items-center gap-1.5">
							<Layers className="size-3.5" />
							Map Features ({featuresList.length})
						</div>
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
					</div>

					{/* Scrollable list */}
					<div className="space-y-1 overflow-y-auto p-2">
						{featuresList.map((item) => {
							const isSelected = isPathMatch(item.path, selectedPath);
							const isHidden = hiddenPaths.has(item.path) || hiddenPaths.has(normalizePath(item.path));
							const color = getFeatureColor(item.colorIndex);

							return (
								<div
									key={item.path}
									onClick={() => focusFeature(item.path)}
									className={`group flex cursor-pointer items-center justify-between rounded px-1.5 py-1 transition-colors hover:bg-[#3c3836] ${
										isSelected ? "border border-[#fabd2f] bg-[#3c3836]" : ""
									} ${isHidden ? "opacity-45" : ""}`}>
									<div className="flex min-w-0 items-center gap-1.5">
										{/* Color Indicator Swatch */}
										<span
											className="size-2.5 shrink-0 rounded-full border border-[#1d2021] shadow-xs"
											style={{ backgroundColor: color.stroke }}
										/>
										<div className="flex min-w-0 flex-col">
											<span
												className={`font-mono text-xs font-semibold break-words ${
													isHidden ? "text-[#928374] line-through" : ""
												}`}
												style={{ color: isHidden ? undefined : color.stroke }}>
												{wrapOnDots(formatFormattedPath(item.path))}
											</span>
											<span className="text-[10px] leading-tight break-words text-[#83a598]">
												{wrapOnDots(item.path)}
											</span>
										</div>
									</div>

									{/* Feature Visibility Eye Toggle */}
									<button
										type="button"
										onClick={(e) => toggleFeatureVisibility(item.path, e)}
										title={isHidden ? "Show feature on map" : "Hide feature from map"}
										className="ml-1.5 shrink-0 rounded p-1 text-[#928374] transition-colors hover:bg-[#504945] hover:text-[#ebdbb2]">
										{isHidden ? (
											<EyeOff className="size-3.5 text-[#ea696c]" />
										) : (
											<Eye className="size-3.5 text-[#8ec07c]" />
										)}
									</button>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{(!geoJson || !geoJson.features || geoJson.features.length === 0) && (
				<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#1d2021]/80 font-mono text-xs text-[#bdae93] backdrop-blur-xs">
					No GeoJSON features or coordinates detected in current state
				</div>
			)}
		</div>
	);
};
