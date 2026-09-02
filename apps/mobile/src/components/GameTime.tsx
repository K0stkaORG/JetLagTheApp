import type { GameTime, TimelinePhase } from "@jetlag/shared-types";
import { useEffect, useMemo, useState } from "react";
import { Text, type TextStyle } from "react-native";

function secondsToHMS(seconds: number): string {
	const isNegative = seconds < 0;
	const absSeconds = Math.abs(seconds);

	const hrs = Math.floor(absSeconds / 3600);
	const mins = Math.floor((absSeconds % 3600) / 60);
	const secs = Math.floor(absSeconds % 60);

	const sign = isNegative ? "-" : "";

	if (hrs) return `${sign}${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	if (mins) return `${sign}${mins}:${secs.toString().padStart(2, "0")}`;
	return `${sign}0:${secs.toString().padStart(2, "0")}`;
}

type GameTimeProps = {
	sync: Date | string | null;
	gameTime: GameTime;
	phase: TimelinePhase;
	style?: TextStyle;
};

export default function GameTime({ sync, gameTime, phase, style }: GameTimeProps) {
	const [now, setNow] = useState(Date.now());
	const syncTime = useMemo(() => (sync ? new Date(sync).getTime() : 0), [sync]);

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

	if ((phase === "in-progress" || (phase === "not-started" && gameTime < 0)) && sync) {
		const elapsedMs = now - syncTime;
		const totalGameTimeMs = gameTime + elapsedMs;
		return <Text style={style}>{secondsToHMS(Math.floor(totalGameTimeMs / 1000))}</Text>;
	}

	return <Text style={style}>{secondsToHMS(Math.floor(gameTime / 1000))}</Text>;
}
