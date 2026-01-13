import { useEffect, useRef, useState } from "react";

export type UseDurationProps = {
    duration: number;
    durationSync: number;
} & ({ increasing: boolean; decreasing?: never } | { increasing?: never; decreasing: boolean });

export const useDuration = ({
    duration,
    durationSync,
    increasing,
    decreasing,
}: UseDurationProps) => {
    const [text, setText] = useState("");
    const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const startTimeRef = useRef<number | undefined>(undefined);
    const initialDurationRef = useRef<number>(duration);

    const formatDuration = (duration: number): string => {
        // Check if duration is negative
        const isNegative = duration < 0;
        // Use absolute value for calculations
        const absDuration = Math.abs(duration);

        const hours = Math.floor(absDuration / 3600);
        const minutes = Math.floor((absDuration % 3600) / 60);
        const seconds = Math.floor(absDuration % 60);

        let formattedTime = "";

        if (hours > 0)
            formattedTime = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        else if (minutes > 0) formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        else formattedTime = `${seconds}s`;

        // Add negative sign if needed
        return isNegative ? `- ${formattedTime}` : formattedTime;
    };

    useEffect(() => {
        // Clear existing interval if any
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
        }

        if (increasing || decreasing) {
            // Store initial values when increasing starts or duration changes
            initialDurationRef.current = duration;
            startTimeRef.current = durationSync;

            const updateTimer = () => {
                const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current!) / 1000);
                const currentDuration =
                    initialDurationRef.current + (increasing ? elapsedSeconds : -elapsedSeconds);
                setText(formatDuration(currentDuration));
            };

            // Update immediately and then every second
            updateTimer();
            intervalRef.current = setInterval(updateTimer, 500);
        } else {
            // When not increasing or decreasing, just display the static duration
            setText(formatDuration(duration));
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [duration, durationSync, increasing, decreasing]);

    return text;
};
