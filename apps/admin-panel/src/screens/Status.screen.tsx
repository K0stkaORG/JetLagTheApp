import ScreenTemplate from "@/components/ScreenTemplate";
import { getToken } from "@/lib/auth";
import { SERVER_API_BASE } from "@/lib/server";
import { AdminTelemetryResponse, ClientToServerEvents, ServerToClientEvents } from "@jetlag/shared-types";
import Ansi from "ansi-to-react";
import { useEffect, useRef, useState } from "react";
import { useLoaderData } from "react-router";
import { io, type Socket } from "socket.io-client";

const StatusScreen = () => {
	const scrollRef = useRef<HTMLDivElement>(null);

	const [logs, setLogs] = useState<AdminTelemetryResponse["logs"]>(useLoaderData<AdminTelemetryResponse["logs"]>());

	const [isConnected, setIsConnected] = useState(false);

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
		scrollRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [logs.length]);

	return (
		<ScreenTemplate
			title="Status"
			backPath="/"
			scrollable={false}>
			<div className="relative grid size-full grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-[#3c3836] bg-[#1d2021] shadow-2xl">
				{/* Terminal Header */}
				<div className="flex items-center justify-between gap-2 border-b border-[#3c3836] bg-[#282828] px-4 py-2 font-mono text-xs tracking-wide text-[#a89984]">
					<div>logs@jetlag:~</div>
					{isConnected ? (
						<div className="flex items-center gap-2">
							Live
							<span className="inline-block size-3 rounded-full bg-[#98971a]" />
						</div>
					) : (
						<div className="flex items-center gap-2">
							Connection lost
							<span className="inline-block size-3 rounded-full bg-[#cc241d]" />
						</div>
					)}
				</div>

				{/* Terminal Body */}
				<div className="overflow-y-auto p-4 font-mono text-sm leading-relaxed text-[#ebdbb2]">
					{logs.map((log, index) => (
						<div
							key={index}
							className="break-all whitespace-pre-wrap [&_span]:rounded-[3px]">
							<Ansi useClasses>{log}</Ansi>
						</div>
					))}
					{/* Invisible anchor for autoscroll */}
					<div ref={scrollRef} />
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default StatusScreen;
