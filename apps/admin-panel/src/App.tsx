import { AuthProvider, useAuthContext } from "./lib/auth";

import LandingScreen from "./screens/Landing.screen";
import { Routes } from "./lib/routes";
import { Toaster } from "./components/ui/sonner";

function App() {
	const { token } = useAuthContext();

	if (!token) return <LandingScreen />;

	return <Routes />;
}

function AppWrapper() {
	return (
		<AuthProvider>
			<App />
			<Toaster
				richColors
				closeButton
				position="top-right"
			/>
		</AuthProvider>
	);
}

export default AppWrapper;
