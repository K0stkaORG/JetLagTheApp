/* eslint-disable react-hooks/set-state-in-effect */
import ConfirmButton from "@/components/ConfirmButton";
import { GeoJsonMap } from "@/components/GeoJsonMap";
import ScreenTemplate from "@/components/ScreenTemplate";
import { StateInspector, StateInspectorHandle } from "@/components/StateInspector";
import { LiveDot } from "@/components/StatusBadge";
import { getToken } from "@/lib/auth";
import { SERVER_API_BASE, useServer } from "@/lib/server";
import {
	AdminGeoResponse,
	AdminLogsResponse,
	AdminStateResponse,
	ClientToServerEvents,
	IdMap,
	ServerToClientEvents,
} from "@jetlag/shared-types";
import Ansi from "ansi-to-react";
import { Columns, DatabaseBackup, Layers, Loader2, Map as MapIcon, RotateCw, Terminal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

type StatusMode = "state" | "logs" | "map" | "split";

type GeoJson = { type: "FeatureCollection"; features: AdminGeoResponse["geoJson"] };

const StatusScreen = () => {
	const scrollRef = useRef<HTMLDivElement>(null);

	const [mode, setMode] = useState<StatusMode>("logs");
	const stateInspectorRef = useRef<StateInspectorHandle>(null);
	const [logs, setLogs] = useState<string[]>([]);
	const [state, setState] = useState<unknown>(null);
	const [geoJson, setGeoJson] = useState<GeoJson>({ type: "FeatureCollection", features: [] });
	const [selectedPath, setSelectedPath] = useState<string | undefined>(undefined);
	const [isConnected, setIsConnected] = useState(false);

	// Track which tabs have been loaded at least once
	const [loadedTabs, setLoadedTabs] = useState<Set<StatusMode>>(new Set());
	const [loadingTabs, setLoadingTabs] = useState<Set<StatusMode>>(new Set());

	const markLoading = useCallback((tab: StatusMode, loading: boolean) => {
		setLoadingTabs((prev) => {
			const next = new Set(prev);
			if (loading) next.add(tab);
			else next.delete(tab);
			return next;
		});
	}, []);

	const markLoaded = useCallback((tab: StatusMode) => {
		setLoadedTabs((prev) => new Set([...prev, tab]));
	}, []);

	// ── Per-tab fetch functions ──────────────────────────────────────────────

	const fetchLogs = useCallback(async () => {
		markLoading("logs", true);
		const response = await useServer<void, AdminLogsResponse>({
			method: "GET",
			path: "/telemetry/logs",
			showPendingToast: false,
		});
		markLoading("logs", false);
		if (response.result === "success") {
			setLogs(response.data.logs);
			markLoaded("logs");
		}
	}, [markLoading, markLoaded]);

	const fetchState = useCallback(async () => {
		markLoading("state", true);
		const response = await useServer<void, AdminStateResponse>({
			method: "GET",
			path: "/telemetry/state",
			showPendingToast: false,
			reviver: IdMap.reviver,
		});
		markLoading("state", false);
		if (response.result === "success") {
			setState(response.data.state);
			markLoaded("state");
		}
	}, [markLoading, markLoaded]);

	const fetchGeo = useCallback(async () => {
		markLoading("map", true);
		const response = await useServer<void, AdminGeoResponse>({
			method: "GET",
			path: "/telemetry/geo",
			showPendingToast: false,
		});
		markLoading("map", false);
		if (response.result === "success") {
			setGeoJson({ type: "FeatureCollection", features: response.data.geoJson });
			markLoaded("map");
		}
	}, [markLoading, markLoaded]);

	// ── Reload for active tab ────────────────────────────────────────────────

	const refreshActiveTab = useCallback(async () => {
		if (mode === "logs") await fetchLogs();
		else if (mode === "state") await fetchState();
		else if (mode === "map") await fetchGeo();
		else if (mode === "split") {
			await Promise.all([fetchState(), fetchGeo()]);
		}
	}, [mode, fetchLogs, fetchState, fetchGeo]);

	// ── On tab switch, lazy-load if not yet loaded ───────────────────────────

	useEffect(() => {
		if (mode === "logs" && !loadedTabs.has("logs")) {
			fetchLogs();
		} else if (mode === "state" && !loadedTabs.has("state")) {
			fetchState();
		} else if (mode === "map" && !loadedTabs.has("map")) {
			fetchGeo();
		} else if (mode === "split") {
			const fetches: Promise<void>[] = [];
			if (!loadedTabs.has("state")) fetches.push(fetchState());
			if (!loadedTabs.has("map")) fetches.push(fetchGeo());
			if (fetches.length > 0) Promise.all(fetches);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode]);

	// ── Keyboard shortcut ────────────────────────────────────────────────────

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.altKey && (e.key === "r" || e.key === "R")) {
				e.preventDefault();
				refreshActiveTab();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [refreshActiveTab]);

	// ── WebSocket for live log streaming ─────────────────────────────────────

	useEffect(() => {
		const socket = io(SERVER_API_BASE, {
			path: "/socket.io",
			auth: {
				token: `0:${getToken()}`,
			},
		}) as Socket<ServerToClientEvents, ClientToServerEvents>;

		socket.on("connect", () => setIsConnected(true));
		socket.on("disconnect", () => setIsConnected(false));

		socket.on("telemetry.log", ({ message }) => {
			setLogs((prev) => [...prev, message]);
			// Mark logs as "loaded" once we receive live data too
			setLoadedTabs((prev) => new Set([...prev, "logs"]));
		});

		return () => {
			socket.off("connect");
			socket.off("disconnect");
			socket.off("telemetry.log");
			socket.disconnect();
			setIsConnected(false);
		};
	}, []);

	// ── Auto-scroll logs ──────────────────────────────────────────────────────

	useEffect(() => {
		if (mode === "logs") {
			scrollRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [logs.length, mode]);

	// ── GeoJson path set for split view map pin buttons ──────────────────────

	const geoJsonPaths = useMemo(() => {
		const paths = new Set<string>();
		if (geoJson?.features) {
			for (const feat of geoJson.features) {
				const p = feat?.properties?.path;
				if (!p) continue;
				const v2 = p.replace(/\.idToObjectMap\./g, ".");
				const v3 = p.replace(/Symbol\(([^)]+)\)/g, "$1");
				const v4 = v2.replace(/Symbol\(([^)]+)\)/g, "$1");
				paths.add(p);
				paths.add(v2);
				paths.add(v3);
				paths.add(v4);
			}
		}
		return paths;
	}, [geoJson]);

	// ── Tree helpers ──────────────────────────────────────────────────────────

	const expandAllNodes = () => {
		stateInspectorRef.current?.expandAll();
	};

	const collapseAllNodes = () => {
		stateInspectorRef.current?.collapseAll();
	};

	const restartServer = useCallback(async () => {
		await useServer<void, void>({
			method: "POST",
			path: "/telemetry/restart",
			showPendingToast: false,
			voidResponse: true,
		});
	}, []);

	// ── Derived state ─────────────────────────────────────────────────────────

	const isStateLoading = loadingTabs.has("state");
	const isLogsLoading = loadingTabs.has("logs");
	const isMapLoading = loadingTabs.has("map");

	return (
		<ScreenTemplate
			title="Status"
			backPath="/"
			scrollable={false}
			compactPadding={true}>
			<div className="relative grid size-full grid-rows-[auto_1fr] overflow-hidden rounded-sm border border-[#3c3836] bg-[#1d2021] shadow-2xl">
				{/* Unified Main Top Bar - Responsive for mobile */}
				<div className="flex flex-wrap items-center justify-center-safe gap-2 border-b border-[#3c3836] bg-[#282828] px-3 py-1.5 font-mono text-xs text-[#a89984] md:justify-between">
					<div className="flex w-full shrink-0 items-center justify-stretch gap-1 overflow-x-auto rounded-[5px] border border-[#504945] bg-[#1d2021] md:w-auto">
						<button
							type="button"
							onClick={() => setMode("state")}
							className={`flex flex-1 cursor-pointer items-center justify-center gap-1 rounded px-2 py-1 font-mono text-xs text-nowrap transition-colors duration-100 md:justify-start ${
								mode === "state"
									? "bg-[#504945] font-semibold text-[#fabd2f]"
									: "text-[#928374] hover:bg-[#32302f] hover:text-[#ebdbb2]"
							}`}>
							<Layers className="size-3.5" />
							<span className="hidden sm:inline">State Tree</span>
							<span className="sm:hidden">State</span>
						</button>
						<button
							type="button"
							onClick={() => setMode("split")}
							className={`flex flex-1 cursor-pointer items-center justify-center gap-1 rounded px-2 py-1 font-mono text-xs text-nowrap transition-colors duration-100 md:justify-start ${
								mode === "split"
									? "bg-[#504945] font-semibold text-[#fabd2f]"
									: "text-[#928374] hover:bg-[#32302f] hover:text-[#ebdbb2]"
							}`}>
							<Columns className="size-3.5" />
							Split
						</button>
						<button
							type="button"
							onClick={() => setMode("map")}
							className={`flex flex-1 cursor-pointer items-center justify-center gap-1 rounded px-2 py-1 font-mono text-xs text-nowrap transition-colors duration-100 md:justify-start ${
								mode === "map"
									? "bg-[#504945] font-semibold text-[#fabd2f]"
									: "text-[#928374] hover:bg-[#32302f] hover:text-[#ebdbb2]"
							}`}>
							<MapIcon className="size-3.5" />
							Map
						</button>
						<button
							type="button"
							onClick={() => setMode("logs")}
							className={`flex flex-1 cursor-pointer items-center justify-center gap-1 rounded px-2 py-1 font-mono text-xs text-nowrap transition-colors duration-100 md:justify-start ${
								mode === "logs"
									? "bg-[#504945] font-semibold text-[#fabd2f]"
									: "text-[#928374] hover:bg-[#32302f] hover:text-[#ebdbb2]"
							}`}>
							<Terminal className="size-3.5" />
							Logs
						</button>
					</div>

					<div className="flex flex-wrap items-center gap-1.5">
						{(mode === "state" || mode === "split") && (
							<>
								<button
									type="button"
									onClick={expandAllNodes}
									className="flex cursor-pointer items-center gap-1 rounded border border-[#504945] bg-[#32302f] px-2 py-0.5 text-xs text-[#bdae93] shadow-xs transition-all duration-150 hover:border-[#fabd2f]/50 hover:bg-[#504945] hover:text-[#fabd2f] active:scale-95">
									Expand all
								</button>
								<button
									type="button"
									onClick={collapseAllNodes}
									className="flex cursor-pointer items-center gap-1 rounded border border-[#504945] bg-[#32302f] px-2 py-0.5 text-xs text-[#bdae93] shadow-xs transition-all duration-150 hover:border-[#fabd2f]/50 hover:bg-[#504945] hover:text-[#fabd2f] active:scale-95">
									Collapse all
								</button>
							</>
						)}

						{(mode === "map" || mode === "state" || mode === "split") && (
							<button
								type="button"
								onClick={refreshActiveTab}
								title="Reload data (Alt+R)"
								className="flex cursor-pointer items-center gap-1 rounded border border-[#504945] bg-[#32302f] px-2 py-0.5 text-xs text-[#bdae93] shadow-xs transition-all duration-150 hover:border-[#fabd2f]/50 hover:bg-[#504945] hover:text-[#fabd2f] active:scale-95">
								<RotateCw className="size-3" />
								<span className="hidden sm:inline">Reload (Alt+R)</span>
								<span className="sm:hidden">Reload</span>
							</button>
						)}

						{mode === "logs" && (
							<>
								{isConnected ? (
									<div className="ml-1 flex items-center gap-1 font-mono text-xs text-[#b8bb26]">
										Live
										<LiveDot />
									</div>
								) : (
									<div className="ml-1 flex items-center gap-1 font-mono text-xs text-[#fb4934]">
										Offline
										<span className="inline-block size-2 rounded-full bg-[#fb4934]" />
									</div>
								)}
								<ConfirmButton
									onClick={restartServer}
									confirmMessage="Are you sure you want to restart the server?"
									confirmButtonText="Restart"
									variant="destructive"
									className="ml-2 h-auto cursor-pointer rounded px-2 py-0.5 text-xs shadow-xs active:scale-95">
									<DatabaseBackup className="size-3" />
									Restart server
								</ConfirmButton>
							</>
						)}
					</div>
				</div>

				{/* Main Content Area */}
				<div className="relative size-full overflow-hidden p-1.5">
					{mode === "logs" && (
						<div className="size-full space-y-3 overflow-y-auto rounded bg-[#1d2021] p-3 font-mono text-sm leading-relaxed text-[#ebdbb2] md:space-y-0">
							{isLogsLoading && logs.length === 0 && (
								<div className="flex items-center gap-2 text-[#928374]">
									<Loader2 className="size-4 animate-spin" />
									Loading logs…
								</div>
							)}
							{logs.map((log, index) => (
								<div
									key={index}
									className="whitespace-pre-wrap [&_span]:rounded-[3px]">
									<Ansi useClasses>{log}</Ansi>
								</div>
							))}
							<div ref={scrollRef} />
						</div>
					)}

					{mode === "state" && (
						<div className="relative size-full">
							{isStateLoading && (
								<div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1d2021]/60 backdrop-blur-xs">
									<div className="flex items-center gap-2 rounded border border-[#504945] bg-[#282828] px-4 py-2 font-mono text-xs text-[#bdae93]">
										<Loader2 className="size-4 animate-spin text-[#fabd2f]" />
										Loading state…
									</div>
								</div>
							)}
							<StateInspector
								ref={stateInspectorRef}
								state={state}
								onSelectPath={(p) => setSelectedPath(p)}
							/>
						</div>
					)}

					{mode === "map" && (
						<div className="relative size-full overflow-hidden rounded">
							{isMapLoading && geoJson.features.length === 0 && (
								<div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1d2021]/60 backdrop-blur-xs">
									<div className="flex items-center gap-2 rounded border border-[#504945] bg-[#282828] px-4 py-2 font-mono text-xs text-[#bdae93]">
										<Loader2 className="size-4 animate-spin text-[#fabd2f]" />
										Loading map data…
									</div>
								</div>
							)}
							<GeoJsonMap
								geoJson={geoJson}
								selectedPath={selectedPath}
								onSelectFeature={(p) => setSelectedPath(p)}
								showLegend={true}
								startAllHidden={true}
							/>
						</div>
					)}

					{mode === "split" && (
						<div className="flex size-full min-h-0 flex-col gap-1.5 overflow-hidden md:flex-row">
							<div className="relative size-full min-h-0 min-w-0 flex-2 overflow-hidden rounded md:flex-1">
								{isStateLoading && (
									<div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1d2021]/60 backdrop-blur-xs">
										<div className="flex items-center gap-2 rounded border border-[#504945] bg-[#282828] px-4 py-2 font-mono text-xs text-[#bdae93]">
											<Loader2 className="size-4 animate-spin text-[#fabd2f]" />
											Loading state…
										</div>
									</div>
								)}
								<StateInspector
									ref={stateInspectorRef}
									state={state}
									geoJsonPaths={geoJsonPaths}
									onSelectPath={(p) => setSelectedPath(p)}
								/>
							</div>
							<div className="relative size-full min-h-0 min-w-0 flex-1 overflow-hidden rounded border border-[#3c3836]">
								{isMapLoading && geoJson.features.length === 0 && (
									<div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1d2021]/60 backdrop-blur-xs">
										<div className="flex items-center gap-2 rounded border border-[#504945] bg-[#282828] px-4 py-2 font-mono text-xs text-[#bdae93]">
											<Loader2 className="size-4 animate-spin text-[#fabd2f]" />
											Loading map data…
										</div>
									</div>
								)}
								<GeoJsonMap
									geoJson={geoJson}
									selectedPath={selectedPath}
									onSelectFeature={(p) => setSelectedPath(p)}
									showLegend={false}
									isolateSelected={true}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default StatusScreen;
