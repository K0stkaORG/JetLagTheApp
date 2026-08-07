import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ArrowLeft, FileChartColumn, Gamepad2, LayoutDashboard, LogOut, MapPinned } from "lucide-react";
import { Link, useLocation } from "react-router";

interface ScreenTemplateProps {
	title: string;
	backPath?: string;
	children: React.ReactNode;
	scrollable?: boolean;
	compactPadding?: boolean;
}

const ScreenTemplate = ({
	title,
	backPath,
	children,
	scrollable = true,
	compactPadding = false,
}: ScreenTemplateProps) => {
	const location = useLocation();

	const navItems = [
		{ path: "/panel/games", label: "Games", icon: Gamepad2 },
		{ path: "/panel/datasets", label: "Datasets", icon: MapPinned },
		{ path: "/panel/status", label: "Status", icon: FileChartColumn },
	];

	const { updateToken } = useAuthContext();

	const handleLogout = () => {
		updateToken(null);
	};

	return (
		<div className="relative flex h-dvh w-dvw flex-col overflow-hidden bg-[#0d1520] text-white">
			{/* Fixed background gradient */}
			<div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-br from-[#0d1520] via-[#14202e] to-[#091018]" />
			<div
				className="pointer-events-none fixed top-0 left-1/2 z-0 h-180 w-4xl -translate-x-1/2 rounded-full opacity-50"
				style={{
					// background:
					// 	"radial-gradient(ellipse, color-mix(in oklch, var(--primary) 8%, transparent) 0%, transparent 70%)",
					background: "lime",
				}}
			/>

			{/* Header Navigation */}
			<header className="relative z-30 flex h-14 flex-none items-center justify-between border-b border-white/10 bg-[#0d1520]/90 px-6 backdrop-blur-xs">
				<div className="flex items-center gap-3">
					<Link
						to="/"
						className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
						<img
							src="/logo.svg"
							alt="JetLag"
							className="size-7"
						/>
						<span className="text-base font-black tracking-tight text-white">
							JetLag: <span className="font-bold text-white/60">The App</span>
						</span>
					</Link>

					<div className="hidden h-4 w-px bg-white/15 md:block" />

					<h1 className="hidden text-sm font-bold md:block">{title}</h1>
				</div>

				{/* Navigation Links */}
				<div className="flex items-center gap-1">
					<Link
						to="/"
						className={cn(
							"hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors md:flex",
							location.pathname === "/"
								? "border border-white/10 bg-white/10 text-white"
								: "text-white/55 hover:bg-white/5 hover:text-white",
						)}>
						<LayoutDashboard className="size-3.5" />
						Dashboard
					</Link>
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = location.pathname.startsWith(item.path);
						return (
							<Link
								key={item.path}
								to={item.path}
								className={cn(
									"hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors md:flex",
									isActive
										? "border border-white/10 bg-white/10 text-white"
										: "text-white/55 hover:bg-white/5 hover:text-white",
								)}>
								<Icon className="text-primary size-3.5" />
								{item.label}
							</Link>
						);
					})}
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={handleLogout}
						className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/55 transition-colors hover:bg-white/5 hover:text-white">
						<LogOut className="text-destructive size-3.5" />
					</Button>
				</div>
			</header>

			{/* Main Content Viewport */}
			<div
				className={cn("relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden", {
					"overflow-y-auto": scrollable,
				})}>
				<div
					className={cn("mx-auto flex w-full max-w-7xl flex-1 flex-col", {
						"min-h-full": scrollable,
						"h-full min-h-0": !scrollable,
					})}>
					{/* Standardized Back Button in Layout */}
					{backPath && (
						<div className="flex-none px-4 pt-4 md:px-8 md:pt-6">
							<Button
								variant="ghost"
								asChild
								className="h-7 cursor-pointer gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60 transition-colors hover:bg-white/6 hover:text-white dark:hover:bg-white/6">
								<Link to={backPath}>
									<ArrowLeft className="size-3.5" />
									Back
								</Link>
							</Button>
						</div>
					)}

					<div
						className={cn(
							"animate-in fade-in flex h-full min-h-0 flex-1 flex-col p-4 duration-200 md:p-8",
							{
								"overflow-hidden": !scrollable,
								"py-2 md:py-3": compactPadding,
							},
						)}>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ScreenTemplate;
