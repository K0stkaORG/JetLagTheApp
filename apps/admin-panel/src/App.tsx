import { AuthProvider, useAuthContext } from "./lib/auth";

import { Toaster } from "./components/ui/sonner";
import { Routes } from "./lib/routes";
import LandingScreen from "./screens/Landing.screen";

import { UpdatePrompt, UpdateProvider } from "./components/UpdatePrompt";

function App() {
	const { token } = useAuthContext();

	if (!token) return <LandingScreen />;

	return <Routes />;
}

function AppWrapper() {
	return (
		<UpdateProvider>
			<AuthProvider>
				<App />
			</AuthProvider>

			<Toaster
				richColors
				closeButton
				position="top-right"
			/>
			<UpdatePrompt />
		</UpdateProvider>
	);
}

export default AppWrapper;
