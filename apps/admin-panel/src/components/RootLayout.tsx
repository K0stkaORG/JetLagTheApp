import { CornerWave } from "@/screens/Landing.screen";
import { Outlet } from "react-router";
import { GlobalLoader } from "./GlobalLoader";

export const RootLayout = () => {
	return (
		<>
			<GlobalLoader />
			<div className="fixed inset-0 z-1">
				<CornerWave
					corner="top"
					className="opacity-20"
				/>
				<CornerWave
					corner="bottom"
					className="opacity-20"
				/>
			</div>
			<Outlet />
		</>
	);
};
