import LoginScreen from "./screens/Login.screen";
import { Routes } from "./lib/routes";
import { useAuthContext } from "./lib/auth";

function App() {
	const { token } = useAuthContext();

	if (!token) return <LoginScreen />;

	return <Routes />;
}

export default App;
