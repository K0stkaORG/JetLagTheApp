import { cn } from "@/lib/utils";
import { WifiOff, type LucideIcon } from "lucide-react";

interface StatusBadgeProps {
	variant?: "running" | "offline" | "info" | "neutral";
	label?: string;
	icon?: LucideIcon;
	pulse?: boolean;
	className?: string;
}

export const LiveDot = ({ className }: { className?: string }) => {
	return (
		<span className={cn("relative inline-flex size-3", className)}>
			<span className="absolute inset-0.5 block animate-ping rounded-full bg-[#b8bb26] opacity-75" />
			<span className="absolute inset-0.5 block rounded-full bg-[#b8bb26]" />
		</span>
	);
};

export const StatusBadge = ({ variant = "neutral", label, icon: Icon, pulse = false, className }: StatusBadgeProps) => {
	if (variant === "running") {
		//greenish
		return (
			<span
				className={cn(
					"inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#b8bb26]/30 bg-[#b8bb26]/10 px-2.5 py-0.5 text-xs font-semibold text-[#b8bb26]",
					className,
				)}>
				<LiveDot />
				{label || "Running"}
			</span>
		);
	}

	if (variant === "offline") {
		return (
			<span
				className={cn(
					"inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#ff4d4f]/30 bg-[#ff4d4f]/10 px-2.5 py-0.5 text-xs font-semibold text-[#ff4d4f]",
					className,
				)}>
				<WifiOff className="size-3" />
				{label || "Offline"}
			</span>
		);
	}

	if (variant === "info") {
		return (
			<span
				className={cn(
					"inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#4edebe]/30 bg-[#4edebe]/10 px-2.5 py-0.5 text-xs font-semibold text-[#4edebe]",
					className,
				)}>
				{pulse && <span className="size-1.5 animate-pulse rounded-full bg-[#4edebe]" />}
				{Icon && <Icon className="size-3" />}
				{label}
			</span>
		);
	}

	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs font-semibold text-white/70",
				className,
			)}>
			{Icon && <Icon className="size-3 text-[#4edebe]" />}
			{label}
		</span>
	);
};

export default StatusBadge;
