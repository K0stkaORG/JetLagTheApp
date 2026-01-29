"use client";

import { ChevronDownIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import React from "react";
import { format } from "date-fns";

interface DatePickerProps {
	value?: Date;
	onChange: (date: Date | undefined) => void;
	label?: string;
	placeholder?: string;
}

export function DatePicker({ value, onChange, label, placeholder = "Pick a date" }: DatePickerProps) {
	const lastEmittedRef = React.useRef<number | null>(null);
	const hourRef = React.useRef<HTMLInputElement>(null);
	const minuteRef = React.useRef<HTMLInputElement>(null);
	const timeRef = React.useRef<{ hour: string; minute: string }>({ hour: "", minute: "" });

	React.useEffect(() => {
		if (!value) {
			timeRef.current = { hour: "", minute: "" };
			if (hourRef.current) hourRef.current.value = "";
			if (minuteRef.current) minuteRef.current.value = "";
			return;
		}
		if (lastEmittedRef.current === value.getTime()) return;
		timeRef.current = {
			hour: value.getHours().toString().padStart(2, "0"),
			minute: value.getMinutes().toString().padStart(2, "0"),
		};
		if (hourRef.current) hourRef.current.value = timeRef.current.hour;
		if (minuteRef.current) minuteRef.current.value = timeRef.current.minute;
	}, [value]);

	const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
	const pad2 = (val: number) => val.toString().padStart(2, "0");
	const parseTimeValue = (val: string, max: number) =>
		val === "" ? undefined : clamp(Number.parseInt(val, 10) || 0, 0, max);

	const emitChange = React.useCallback(
		(date: Date) => {
			lastEmittedRef.current = date.getTime();
			onChange(date);
		},
		[onChange],
	);

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value: val } = e.target;
		if (!/^\d{0,2}$/.test(val)) return;
		timeRef.current = { ...timeRef.current, [name]: val };
		if (!value) return;
		const nextHour = parseTimeValue(name === "hour" ? val : timeRef.current.hour, 23);
		const nextMinute = parseTimeValue(name === "minute" ? val : timeRef.current.minute, 59);
		if (nextHour === undefined || nextMinute === undefined) return;
		const newDate = new Date(value);
		newDate.setHours(nextHour);
		newDate.setMinutes(nextMinute);
		emitChange(newDate);
	};

	const handleTimeBlur = (field: "hour" | "minute") => {
		const raw = timeRef.current[field];
		const max = field === "hour" ? 23 : 59;
		const next = clamp(Number.parseInt(raw || "0", 10) || 0, 0, max);
		const normalized = pad2(next);
		timeRef.current = { ...timeRef.current, [field]: normalized };
		if (field === "hour" && hourRef.current) hourRef.current.value = normalized;
		if (field === "minute" && minuteRef.current) minuteRef.current.value = normalized;
		if (!value) return;
		const newDate = new Date(value);
		if (field === "hour") newDate.setHours(next);
		if (field === "minute") newDate.setMinutes(next);
		emitChange(newDate);
	};

	const handleTimeKeyDown = (field: "hour" | "minute") => (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
		e.preventDefault();
		const max = field === "hour" ? 23 : 59;
		const current = clamp(Number.parseInt(timeRef.current[field] || "0", 10) || 0, 0, max);
		const delta = e.key === "ArrowUp" ? 1 : -1;
		const next = (current + delta + (max + 1)) % (max + 1);
		const normalized = pad2(next);
		timeRef.current = { ...timeRef.current, [field]: normalized };
		if (field === "hour" && hourRef.current) hourRef.current.value = normalized;
		if (field === "minute" && minuteRef.current) minuteRef.current.value = normalized;
		if (!value) return;
		if (e.repeat) return;
		const newDate = new Date(value);
		if (field === "hour") newDate.setHours(next);
		if (field === "minute") newDate.setMinutes(next);
		emitChange(newDate);
	};

	const handleTimeKeyUp = () => (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
		if (!value) return;
		const hour = parseTimeValue(timeRef.current.hour, 23);
		const minute = parseTimeValue(timeRef.current.minute, 59);
		if (hour === undefined || minute === undefined) return;
		const newDate = new Date(value);
		newDate.setHours(hour);
		newDate.setMinutes(minute);
		emitChange(newDate);
	};

	const handleDateChange = (date: Date | undefined) => {
		if (!date) {
			onChange(undefined);
			return;
		}
		const hour = Number(timeRef.current.hour) || 0;
		const minute = Number(timeRef.current.minute) || 0;
		const newDate = new Date(date);
		newDate.setHours(hour);
		newDate.setMinutes(minute);
		emitChange(newDate);
	};

	return (
		<div className="flex flex-col gap-2">
			{label && <label className="text-sm font-medium">{label}</label>}
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						data-empty={!value}
						className="data-[empty=true]:text-muted-foreground w-53 justify-between text-left font-normal">
						{value ? `${format(value, "PPP")} ${format(value, "HH:mm")}` : <span>{placeholder}</span>}
						<ChevronDownIcon />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto p-0"
					align="start">
					<div className="flex flex-col gap-2 p-4">
						<Calendar
							mode="single"
							selected={value}
							onSelect={handleDateChange}
							defaultMonth={value}
						/>
						<div className="mt-2 rounded-md border bg-muted/30 p-2">
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<span className="text-xs font-medium text-muted-foreground">Time</span>
								<div className="ml-auto flex items-center gap-1">
									<Input
										type="text"
										inputMode="numeric"
										ref={hourRef}
										name="hour"
										placeholder="HH"
										defaultValue={timeRef.current.hour}
										onChange={handleTimeChange}
										onBlur={() => handleTimeBlur("hour")}
										onKeyDown={handleTimeKeyDown("hour")}
										onKeyUp={handleTimeKeyUp()}
										maxLength={2}
										autoComplete="off"
										aria-label="Hour"
										className="h-8 w-12 bg-background/60 px-2 text-center tabular-nums"
									/>
									<span className="text-muted-foreground">:</span>
									<Input
										type="text"
										inputMode="numeric"
										ref={minuteRef}
										name="minute"
										placeholder="MM"
										defaultValue={timeRef.current.minute}
										onChange={handleTimeChange}
										onBlur={() => handleTimeBlur("minute")}
										onKeyDown={handleTimeKeyDown("minute")}
										onKeyUp={handleTimeKeyUp()}
										maxLength={2}
										autoComplete="off"
										aria-label="Minute"
										className="h-8 w-12 bg-background/60 px-2 text-center tabular-nums"
									/>
								</div>
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
