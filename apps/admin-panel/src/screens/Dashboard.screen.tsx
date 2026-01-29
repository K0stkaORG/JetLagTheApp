import { Link } from "react-router";
import { FileChartColumn, Gamepad2, MapPinned, type LucideIcon } from "lucide-react";

type DashboardButtonProps = {
	path: string;
	icon: LucideIcon;
	label: string;
};

const DashboardButton = ({ path, icon: Icon, label }: DashboardButtonProps) => {
	return (
		<Link
			to={path}
			className="flex flex-col outline-2 shadow-md items-center justify-center gap-3 p-6 rounded-lg hover:outline-white/50 transition-colors">
			<Icon className="size-8" />
			<div className="text-sm font-semibold">{label}</div>
		</Link>
	);
};

const DashboardScreen = () => {
	return (
		<div className="w-dvw h-dvh flex items-center-safe justify-center-safe flex-col gap-5">
			<h1 className="text-3xl font-bold">JetLag Server Dashboard</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
				<DashboardButton
					path="/panel/games"
					icon={Gamepad2}
					label="Games"
				/>
				<DashboardButton
					path="/panel/datasets"
					icon={MapPinned}
					label="Datasets"
				/>
				<DashboardButton
					path="/panel/status"
					icon={FileChartColumn}
					label="Status"
				/>
			</div>
		</div>
	);
};

export default DashboardScreen;
