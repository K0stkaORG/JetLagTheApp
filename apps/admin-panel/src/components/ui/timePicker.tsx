"use strict";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import * as React from "react";
import { useCallback, useRef } from "react";

export interface TimePickerProps {
	/** Format: "HH:MM:SS", "HH:MM", or "HH" depending on granularity */
	value?: string;
	onChange?: (value: string) => void;
	granularity?: "hour" | "minute" | "second";
	className?: string;
	disabled?: boolean;
}

export const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
	({ value = "00:00:00", onChange, granularity = "second", className, disabled }, ref) => {
		const hourRef = useRef<HTMLInputElement>(null);
		const minRef = useRef<HTMLInputElement>(null);
		const secRef = useRef<HTMLInputElement>(null);

		// Parse standard colon strings cleanly, allowing empty strings or single digits during edits
		const [hStr = "", mStr = "", sStr = ""] = (value || "").split(":");
		const hh = hStr;
		const mm = mStr;
		const ss = sStr;

		const updateSegment = useCallback(
			(type: "h" | "m" | "s", nextVal: string) => {
				let clean = nextVal;

				if (nextVal !== "") {
					let parsed = parseInt(nextVal, 10);
					if (isNaN(parsed)) parsed = 0;

					if (type === "h") {
						parsed = Math.max(0, Math.min(23, parsed));
					} else {
						parsed = Math.max(0, Math.min(59, parsed));
					}

					// Retain single digits while typing; pad only if it's already a double-digit length
					if (nextVal.length === 1) {
						clean = String(parsed);
					} else {
						clean = String(parsed).padStart(2, "0");
					}
				}

				const nextHH = type === "h" ? clean : hh;
				const nextMM = type === "m" ? clean : mm;
				const nextSS = type === "s" ? clean : ss;

				// Check if all active segments are cleared out entirely
				const isEmpty =
					(granularity === "hour" && !nextHH) ||
					(granularity === "minute" && !nextHH && !nextMM) ||
					(granularity === "second" && !nextHH && !nextMM && !nextSS);

				if (isEmpty) {
					onChange?.("");
				} else {
					if (granularity === "hour") {
						onChange?.(nextHH);
					} else if (granularity === "minute") {
						onChange?.(`${nextHH}:${nextMM}`);
					} else {
						onChange?.(`${nextHH}:${nextMM}:${nextSS}`);
					}
				}
			},
			[hh, mm, ss, granularity, onChange],
		);

		const handleKeyDown = (
			e: React.KeyboardEvent<HTMLInputElement>,
			type: "h" | "m" | "s",
			current: string,
			prevRef: React.RefObject<HTMLInputElement | null>,
			nextRef: React.RefObject<HTMLInputElement | null>,
		) => {
			const target = e.currentTarget;
			const selectionStart = target.selectionStart ?? 0;
			const selectionEnd = target.selectionEnd ?? 0;

			// Arrow Left: Move only if the cursor is at the very beginning
			if (e.key === "ArrowLeft") {
				if (selectionStart === 0 && selectionEnd === 0) {
					e.preventDefault();
					const prevInput = prevRef.current;
					if (prevInput && prevInput !== target) {
						prevInput.focus();
						const length = prevInput.value.length;
						prevInput.setSelectionRange(length, length);
					}
				}
				return;
			}

			// Arrow Right: Move only if the cursor is at the very end
			if (e.key === "ArrowRight") {
				if (selectionStart === current.length && selectionEnd === current.length) {
					e.preventDefault();
					const nextInput = nextRef.current;
					if (nextInput && nextInput !== target) {
						nextInput.focus();
						nextInput.setSelectionRange(0, 0);
					}
				}
				return;
			}

			// Smart Backspace: Deletes one digit at a time; jumps back if empty or at the front
			if (e.key === "Backspace") {
				e.preventDefault();
				if (current === "" || (selectionStart === 0 && selectionEnd === 0)) {
					const prevInput = prevRef.current;
					if (prevInput && prevInput !== target) {
						prevInput.focus();
						const length = prevInput.value.length;
						prevInput.setSelectionRange(length, length);
					}
				} else {
					const newVal =
						selectionStart === selectionEnd
							? current.slice(0, selectionStart - 1) + current.slice(selectionEnd)
							: current.slice(0, selectionStart) + current.slice(selectionEnd);
					updateSegment(type, newVal);
				}
				return;
			}

			// Smart Delete: Deletes one digit forward
			if (e.key === "Delete") {
				e.preventDefault();
				if (selectionStart !== current.length || selectionStart !== selectionEnd) {
					const newVal =
						selectionStart === selectionEnd
							? current.slice(0, selectionStart) + current.slice(selectionStart + 1)
							: current.slice(0, selectionStart) + current.slice(selectionEnd);
					updateSegment(type, newVal);
				}
				return;
			}

			if (e.key === "ArrowUp" || e.key === "ArrowDown") {
				e.preventDefault();
				const step = e.key === "ArrowUp" ? 1 : -1;
				const parsedCurrent = parseInt(current, 10);
				const base = isNaN(parsedCurrent) ? 0 : parsedCurrent;
				updateSegment(type, String(base + step));
			}

			if (e.key >= "0" && e.key <= "9") {
				e.preventDefault();

				const isFullySelected = selectionStart === 0 && selectionEnd === current.length;
				let newVal = "";

				if (isFullySelected || current === "") {
					newVal = e.key;
				} else if (current.length === 1) {
					newVal = current + e.key;
				} else {
					newVal = current.slice(-1) + e.key;
				}

				updateSegment(type, newVal);

				const shouldAdvance =
					newVal.length === 2 ||
					(type === "h" && parseInt(newVal, 10) > 2) ||
					(type !== "h" && parseInt(newVal, 10) > 5);

				if (shouldAdvance) {
					const nextInput = nextRef.current;
					if (nextInput && nextInput !== target) {
						setTimeout(() => {
							nextInput.focus();
							nextInput.setSelectionRange(0, nextInput.value.length);
						}, 0);
					}
				}
			}
		};

		const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
			e.currentTarget.select();
		};

		const handleBlur = (type: "h" | "m" | "s", current: string) => {
			if (current.length === 1) {
				updateSegment(type, current.padStart(2, "0"));
			} else if (current === "") {
				const isEntirelyEmpty = !hh && !mm && !ss;
				if (!isEntirelyEmpty) {
					updateSegment(type, "00");
				}
			}
		};

		const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
			if (disabled) return;

			// Only intercept clicks that aren't hitting the inner inputs directly
			if ((e.target as HTMLElement).tagName !== "INPUT") {
				e.preventDefault();
				hourRef.current?.focus();
			}
		};

		const showSeconds = granularity === "second";
		const showMinutes = showSeconds || granularity === "minute";

		// Unified input text style overriding shadcn defaults cleanly
		const subInputClass =
			"h-7 w-8 border-none bg-transparent p-0 text-center font-mono text-sm tabular-nums shadow-none outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0";

		return (
			<div
				ref={ref}
				onClick={handleContainerClick}
				className={cn(
					"border-input bg-background ring-offset-background focus-within:ring-ring flex h-10 w-full cursor-text items-center gap-1 rounded-md border px-3 py-2 text-sm select-none focus-within:ring-2 focus-within:ring-offset-2",
					disabled && "cursor-not-allowed opacity-50",
					className,
				)}>
				<Clock className="text-muted-foreground pointer-events-none mr-1 h-4 w-4 shrink-0" />

				{/* Hours */}
				<Input
					ref={hourRef}
					type="tel"
					inputMode="decimal"
					value={hh}
					placeholder="00"
					disabled={disabled}
					className={subInputClass}
					onKeyDown={(e) => handleKeyDown(e, "h", hh, hourRef, showMinutes ? minRef : hourRef)}
					onFocus={handleFocus}
					onBlur={(e) => handleBlur("h", e.target.value)}
					onChange={() => {}}
				/>

				{showMinutes && (
					<>
						<span className="text-muted-foreground pointer-events-none text-xs font-medium select-none">
							:
						</span>
						{/* Minutes */}
						<Input
							ref={minRef}
							type="tel"
							inputMode="decimal"
							value={mm}
							placeholder="00"
							disabled={disabled}
							className={subInputClass}
							onKeyDown={(e) => handleKeyDown(e, "m", mm, hourRef, showSeconds ? secRef : minRef)}
							onFocus={handleFocus}
							onBlur={(e) => handleBlur("m", e.target.value)}
							onChange={() => {}}
						/>
					</>
				)}

				{showSeconds && (
					<>
						<span className="text-muted-foreground pointer-events-none text-xs font-medium select-none">
							:
						</span>
						{/* Seconds */}
						<Input
							ref={secRef}
							type="tel"
							inputMode="decimal"
							value={ss}
							placeholder="00"
							disabled={disabled}
							className={subInputClass}
							onKeyDown={(e) => handleKeyDown(e, "s", ss, minRef, secRef)}
							onFocus={handleFocus}
							onBlur={(e) => handleBlur("s", e.target.value)}
							onChange={() => {}}
						/>
					</>
				)}
			</div>
		);
	},
);

TimePicker.displayName = "TimePicker";
