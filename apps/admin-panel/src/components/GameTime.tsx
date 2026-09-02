import { cn } from "@/lib/utils";
import type { GameTime, TimelinePhase } from "@jetlag/shared-types";
import { useEffect, useMemo, useState } from "react";

const secondsToHMS = (seconds: number) => {
	const isNegative = seconds < 0;
	const absSeconds = Math.abs(seconds);

	const hrs = Math.floor(absSeconds / 3600);
	const mins = Math.floor((absSeconds % 3600) / 60);
	const secs = Math.floor(absSeconds % 60);

	const sign = isNegative ? "-" : "";

	if (hrs) return `${sign}${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

	if (mins) return `${sign}${mins}:${secs.toString().padStart(2, "0")}`;

	return `${sign}0:${secs.toString().padStart(2, "0")}`;
};

interface GameTimeProps {
	sync: Date | string;
	gameTime: GameTime;
	phase: TimelinePhase;
	className?: string;
}

const GameTime = ({ sync, gameTime, phase, className }: GameTimeProps) => {
	// eslint-disable-next-line react-hooks/purity
	const [now, setNow] = useState(Date.now());
	const syncTime = useMemo(() => new Date(sync).getTime(), [sync]);

	useEffect(() => {
		if (phase === "in-progress" || (phase === "not-started" && gameTime < 0)) {
			let interval: ReturnType<typeof setInterval> | undefined;
			const update = () => setNow(Date.now());

			const delay = 1000 - (Date.now() % 1000);
			const timeout = setTimeout(() => {
				update();
				interval = setInterval(update, 1000);
			}, delay);

			return () => {
				clearTimeout(timeout);
				if (interval) clearInterval(interval);
			};
		}
	}, [phase, gameTime]);

	if (phase === "in-progress" || (phase === "not-started" && gameTime < 0)) {
		const elapsedMs = now - syncTime;
		const totalGameTimeMs = gameTime + elapsedMs;

		return <span className={cn("font-mono", className)}>{secondsToHMS(Math.floor(totalGameTimeMs / 1000))}</span>;
	}

	return <span className={cn("font-mono", className)}>{secondsToHMS(Math.floor(gameTime / 1000))}</span>;
};

export default GameTime;
