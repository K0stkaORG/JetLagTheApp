import { GeoJsonMap } from "@/components/GeoJsonMap";
import ScreenTemplate from "@/components/ScreenTemplate";
import { saveOpenPaths, setNodeStateAll, StateInspector } from "@/components/StateInspector";
import { getToken } from "@/lib/auth";
import { SERVER_API_BASE, useServer } from "@/lib/server";
import { AdminTelemetryStateResponse, ClientToServerEvents, ServerToClientEvents } from "@jetlag/shared-types";
import Ansi from "ansi-to-react";
import { Columns, Layers, Map as MapIcon, RotateCw, Terminal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData } from "react-router";
import { io, type Socket } from "socket.io-client";

type StatusMode = "state" | "logs" | "map" | "split";

const StatusScreen = () => {
	const initialData = useLoaderData<AdminTelemetryStateResponse>();
	const scrollRef = useRef<HTMLDivElement>(null);

	const [mode, setMode] = useState<StatusMode>("state");
	const [logs, setLogs] = useState<string[]>(initialData?.logs || []);
	const [state, setState] = useState<unknown>(initialData?.state || null);
	const [geoJson, setGeoJson] = useState<AdminTelemetryStateResponse["geoJson"]>(
		initialData?.geoJson || { type: "FeatureCollection", features: [] },
	);
	const [selectedPath, setSelectedPath] = useState<string | undefined>(undefined);
	const [isConnected, setIsConnected] = useState(false);

	const geoJsonPaths = useMemo(() => {
		const paths = new Set<string>();
		if (geoJson?.features) {
			for (const feat of geoJson.features) {
				const p = feat?.properties?.path;
				if (!p) continue;
				// Clean variants to match exact tree node paths:
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

	const refreshData = useCallback(async () => {
		saveOpenPaths();
		const response = await useServer<void, AdminTelemetryStateResponse>({
			method: "GET",
			path: "/telemetry",
			showPendingToast: false,
		});

		if (response.result === "success") {
			setLogs(response.data.logs || []);
			setState(response.data.state || null);
			setGeoJson(response.data.geoJson || { type: "FeatureCollection", features: [] });
		}
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R")) {
				e.preventDefault();
				refreshData();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [refreshData]);

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
		});

		return () => {
			socket.off("connect");
			socket.off("disconnect");
			socket.off("telemetry.log");
			socket.disconnect();
			setIsConnected(false);
		};
	}, []);

	useEffect(() => {
		if (mode === "logs") {
			scrollRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [logs.length, mode]);

	const expandAllNodes = () => {
		setNodeStateAll(document, true, true);
	};

	const collapseAllNodes = () => {
		document.querySelectorAll(".tree-node").forEach((el) => el.classList.remove("open"));
		saveOpenPaths();
	};

	return (
		<ScreenTemplate
			title="Status"
			backPath="/"
			scrollable={false}
			compactPadding={true}>
			<div className="relative grid size-full grid-rows-[auto_1fr] overflow-hidden rounded-sm border border-[#3c3836] bg-[#1d2021] shadow-2xl">
				{/* Unified Main Top Bar */}
				<div className="flex items-center justify-between border-b border-[#3c3836] bg-[#282828] px-4 py-1 font-mono text-xs text-[#a89984]">
					<div className="flex items-center gap-1 rounded-[5px] border border-[#504945] bg-[#1d2021]">
						<button
							type="button"
							onClick={() => setMode("state")}
							className={`flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors duration-100 ${
								mode === "state"
									? "bg-[#504945] font-semibold text-[#fabd2f]"
									: "text-[#928374] hover:bg-[#32302f] hover:text-[#ebdbb2]"
							}`}>
							<Layers className="size-3.5" />
							State Tree
						</button>
						<button
							type="button"
							onClick={() => setMode("split")}
							className={`flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors duration-100 ${
								mode === "split"
									? "bg-[#504945] font-semibold text-[#fabd2f]"
									: "text-[#928374] hover:bg-[#32302f] hover:text-[#ebdbb2]"
							}`}>
							<Columns className="size-3.5" />
							Split View
						</button>
						<button
							type="button"
							onClick={() => setMode("map")}
							className={`flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors duration-100 ${
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
							className={`flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors duration-100 ${
								mode === "logs"
									? "bg-[#504945] font-semibold text-[#fabd2f]"
									: "text-[#928374] hover:bg-[#32302f] hover:text-[#ebdbb2]"
							}`}>
							<Terminal className="size-3.5" />
							Logs ({logs.length})
						</button>
					</div>

					<div className="flex items-center gap-2">
						{(mode === "state" || mode === "split") && (
							<div className="flex items-center gap-1">
								<button
									type="button"
									onClick={refreshData}
									title="Reload data (Ctrl+R)"
									className="flex cursor-pointer items-center gap-1 rounded border border-[#504945] bg-[#32302f] px-2 py-0.5 text-xs text-[#bdae93] shadow-xs transition-all duration-150 hover:border-[#fabd2f]/50 hover:bg-[#504945] hover:text-[#fabd2f] active:scale-95">
									<RotateCw className="size-3" />
									Reload (Ctrl+R)
								</button>
								<button
									type="button"
									onClick={expandAllNodes}
									className="cursor-pointer rounded border border-[#504945] bg-[#32302f] px-2 py-0.5 text-xs text-[#bdae93] shadow-xs transition-all duration-150 hover:border-[#8ec07c]/50 hover:bg-[#504945] hover:text-[#ebdbb2] active:scale-95">
									Expand All
								</button>
								<button
									type="button"
									onClick={collapseAllNodes}
									className="cursor-pointer rounded border border-[#504945] bg-[#32302f] px-2 py-0.5 text-xs text-[#bdae93] shadow-xs transition-all duration-150 hover:border-[#fb4934]/50 hover:bg-[#504945] hover:text-[#ebdbb2] active:scale-95">
									Collapse All
								</button>
							</div>
						)}

						{isConnected ? (
							<div className="ml-2 flex items-center gap-1.5 font-mono text-xs text-[#b8bb26]">
								Live
								<span className="inline-block size-2.5 animate-pulse rounded-full bg-[#b8bb26]" />
							</div>
						) : (
							<div className="ml-2 flex items-center gap-1.5 font-mono text-xs text-[#fb4934]">
								Offline
								<span className="inline-block size-2.5 rounded-full bg-[#fb4934]" />
							</div>
						)}
					</div>
				</div>

				{/* Main Content Area */}
				<div className="relative size-full overflow-hidden p-1.5">
					{mode === "logs" && (
						<div className="size-full overflow-y-auto rounded bg-[#1d2021] p-3 font-mono text-sm leading-relaxed text-[#ebdbb2]">
							{logs.map((log, index) => (
								<div
									key={index}
									className="break-all whitespace-pre-wrap [&_span]:rounded-[3px]">
									<Ansi useClasses>{log}</Ansi>
								</div>
							))}
							<div ref={scrollRef} />
						</div>
					)}

					{mode === "state" && (
						<StateInspector
							state={state}
							onSelectPath={(p) => setSelectedPath(p)}
						/>
					)}

					{mode === "map" && (
						<GeoJsonMap
							geoJson={geoJson}
							selectedPath={selectedPath}
							onSelectFeature={(p) => setSelectedPath(p)}
							showLegend={true}
						/>
					)}

					{mode === "split" && (
						<div className="grid size-full grid-cols-2 gap-1.5 overflow-hidden">
							<StateInspector
								state={state}
								geoJsonPaths={geoJsonPaths}
								onSelectPath={(p) => setSelectedPath(p)}
							/>
							<GeoJsonMap
								geoJson={geoJson}
								selectedPath={selectedPath}
								onSelectFeature={(p) => setSelectedPath(p)}
								showLegend={false}
							/>
						</div>
					)}
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default StatusScreen;
