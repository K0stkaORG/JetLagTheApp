import "./index.css";

import App from "./App.tsx";
import { AuthProvider } from "./lib/auth.tsx";
import { StrictMode } from "react";
import { Toaster } from "./components/ui/sonner.tsx";
import { createRoot } from "react-dom/client";

document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AuthProvider>
			<App />
			<Toaster
				richColors
				closeButton
				position="top-right"
			/>
		</AuthProvider>
	</StrictMode>,
);
