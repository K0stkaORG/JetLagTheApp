import { AuthProvider, useAuthContext } from "./lib/auth";

import LandingScreen from "./screens/Landing.screen";
import { Routes } from "./lib/routes";
import { Toaster } from "./components/ui/sonner";

import { UpdatePrompt } from "./components/UpdatePrompt";

function App() {
	const { token } = useAuthContext();

	if (!token) return <LandingScreen />;

	return <Routes />;
}

function AppWrapper() {
	return (
		<AuthProvider>
			<App />
			<UpdatePrompt />
			<Toaster
				richColors
				closeButton
				position="top-right"
			/>
		</AuthProvider>
	);
}

export default AppWrapper;
