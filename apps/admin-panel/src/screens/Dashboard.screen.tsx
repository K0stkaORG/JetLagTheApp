import { FileChartColumn, Gamepad2, MapPinned, type LucideIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import ScreenTemplate from "@/components/ScreenTemplate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardButtonProps = {
	path: string;
	icon: LucideIcon;
	label: string;
	description: string;
};

const DashboardButton = ({ path, icon: Icon, label, description }: DashboardButtonProps) => {
	return (
		<Link
			to={path}
			className="group">
			<Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 relative overflow-hidden">
				<div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
					<Icon className="size-24 -mr-8 -mt-8 rotate-12" />
				</div>
				<CardHeader>
					<div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
						<Icon className="size-6" />
					</div>
					<CardTitle className="group-hover:text-primary transition-colors">{label}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
						Open {label} <ArrowRight className="ml-1 size-4" />
					</div>
				</CardContent>
			</Card>
		</Link>
	);
};

const DashboardScreen = () => {
	return (
		<ScreenTemplate title="Dashboard">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<DashboardButton
					path="/panel/games"
					icon={Gamepad2}
					label="Games"
					description="Create, manage, and monitor game sessions."
				/>
				<DashboardButton
					path="/panel/datasets"
					icon={MapPinned}
					label="Datasets"
					description="Manage game locations, tasks, and map data."
				/>
				<DashboardButton
					path="/panel/status"
					icon={FileChartColumn}
					label="Status"
					description="View server health, logs, and analytics."
				/>
			</div>
		</ScreenTemplate>
	);
};

export default DashboardScreen;
