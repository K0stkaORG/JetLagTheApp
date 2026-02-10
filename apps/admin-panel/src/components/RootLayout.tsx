import { GlobalLoader } from "./GlobalLoader";
import { Outlet } from "react-router";

export const RootLayout = () => {
	return (
		<>
			<GlobalLoader />
			<Outlet />
		</>
	);
};
