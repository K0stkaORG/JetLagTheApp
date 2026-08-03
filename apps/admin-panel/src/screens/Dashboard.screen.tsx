import AdminCard from "@/components/AdminCard";
import ScreenTemplate from "@/components/ScreenTemplate";
import { FileChartColumn, Gamepad2, MapPinned } from "lucide-react";

const DashboardScreen = () => {
	return (
		<ScreenTemplate title="Dashboard">
			<div className="flex flex-col gap-6 pb-12">
				{/* Hero Banner */}
				<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 backdrop-blur-sm">
					<div
						className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full"
						style={{
							background:
								"radial-gradient(circle, color-mix(in oklch, var(--primary) 10%, transparent) 0%, transparent 70%)",
						}}
					/>
					<div className="relative flex max-w-2xl flex-col gap-1.5">
						<h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
							Manage your <span className="text-primary">JetLag Server</span>
						</h1>
						<p className="text-xs leading-relaxed text-white/55 md:text-sm">
							Welcome to the JetLag Admin Panel! Here you can manage your games, datasets, and monitor
							server status.
						</p>
					</div>
				</div>

				{/* Reusable Admin Cards Grid */}
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
					<AdminCard
						href="/panel/games"
						icon={Gamepad2}
						watermarkIcon={Gamepad2}
						title="Games"
						ctaText="Open Games">
						<p className="text-xs leading-relaxed text-white/60">Create, manage, and monitor games.</p>
					</AdminCard>

					<AdminCard
						href="/panel/datasets"
						icon={MapPinned}
						watermarkIcon={MapPinned}
						title="Datasets"
						ctaText="Open Datasets">
						<p className="text-xs leading-relaxed text-white/60">
							Manage custom game datasets - maps, assets, game configurations, and more.
						</p>
					</AdminCard>

					<AdminCard
						href="/panel/status"
						icon={FileChartColumn}
						watermarkIcon={FileChartColumn}
						title="Status"
						ctaText="Open Status">
						<p className="text-xs leading-relaxed text-white/60">
							View live logs, monitor server health, inspect server memory
						</p>
					</AdminCard>
				</div>
			</div>
		</ScreenTemplate>
	);
};

export default DashboardScreen;
