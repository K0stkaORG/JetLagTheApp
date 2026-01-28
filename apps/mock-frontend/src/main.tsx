import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "@/components/ui/toaster";

document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AppProvider>
			<App />
			<Toaster />
		</AppProvider>
	</StrictMode>,
);
