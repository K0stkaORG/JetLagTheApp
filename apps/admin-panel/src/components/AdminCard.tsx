import { cn } from "@/lib/utils";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router";

interface AdminCardProps {
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	icon?: LucideIcon;
	badge?: React.ReactNode;
	watermarkIcon?: LucideIcon;
	children?: React.ReactNode;
	footer?: React.ReactNode;
	ctaText?: string;
	href?: string;
	className?: string;
}

export const AdminCard = ({
	title,
	subtitle,
	icon: Icon,
	badge,
	watermarkIcon: WatermarkIcon,
	children,
	footer,
	ctaText,
	href,
	className,
}: AdminCardProps) => {
	const content = (
		<div
			className={cn(
				"relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/4 p-5 backdrop-blur-sm transition-all duration-200 ease-out hover:scale-[1.008] hover:border-primary/40 hover:bg-white/[0.07] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
				className,
			)}>
			{/* Watermark Icon */}
			{WatermarkIcon && (
				<div className="pointer-events-none absolute -right-4 -bottom-4 opacity-[0.04] transition-opacity duration-200 group-hover:opacity-[0.08]">
					<WatermarkIcon className="size-32 rotate-6 text-white" />
				</div>
			)}

			<div className="space-y-3.5">
				{/* Top Row: Icon/Title & Badge */}
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-0.5">
						<div className="flex items-center gap-2">
							{Icon && <Icon className="size-5 shrink-0 text-primary" />}
							{typeof title === "string" ? (
								<h3 className="text-base font-bold text-white transition-colors duration-150">
									{title}
								</h3>
							) : (
								title
							)}
						</div>
						{subtitle && <div className="font-mono text-xs font-medium text-white/50">{subtitle}</div>}
					</div>

					{badge && <div className="shrink-0">{badge}</div>}
				</div>

				{/* Card Body Children */}
				{children}
			</div>

			{/* Footer Row */}
			{(footer || ctaText) && (
				<div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
					{footer ? (
						footer
					) : ctaText ? (
						<div className="flex items-center gap-1.5 text-xs font-semibold text-primary/80 transition-all duration-150 group-hover:translate-x-3 group-hover:text-primary">
							{ctaText}
							<ArrowRight className="size-3.5" />
						</div>
					) : null}
				</div>
			)}
		</div>
	);

	if (href) {
		return (
			<Link
				to={href}
				className="flex">
				{content}
			</Link>
		);
	}

	return content;
};

export default AdminCard;
