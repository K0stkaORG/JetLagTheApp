import { AuthProvider, useAuthContext } from "./lib/auth";

import LoginScreen from "./screens/Login.screen";
import { Routes } from "./lib/routes";
import { Toaster } from "./components/ui/sonner";

function App() {
	const { token } = useAuthContext();

	if (!token) return <LoginScreen />;

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
