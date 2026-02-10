import { useEffect, useMemo, useState } from "react";

import { TimelinePhase } from "@jetlag/shared-types";

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
	gameTime: number;
	phase: TimelinePhase;
	className?: string;
}

const GameTime = ({ sync, gameTime, phase, className }: GameTimeProps) => {
	const [now, setNow] = useState(Date.now());
	const syncTime = useMemo(() => new Date(sync).getTime(), [sync]);

	useEffect(() => {
		if (phase === "in-progress" || (phase === "not-started" && gameTime < 0)) {
			const interval = setInterval(() => {
				setNow(Date.now());
			}, 1000);

			return () => clearInterval(interval);
		}
	}, [phase]);

	if (phase === "in-progress" || (phase === "not-started" && gameTime < 0)) {
		const elapsedSeconds = (now - syncTime) / 1000;
		const totalGameTime = gameTime + elapsedSeconds;

		return <span className={`font-mono ${className}`}>{secondsToHMS(Math.round(totalGameTime))}</span>;
	}

	return <span className={`font-mono ${className}`}>{secondsToHMS(gameTime)}</span>;
};

export default GameTime;
