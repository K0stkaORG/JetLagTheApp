import "./index.css";

import AppWrapper from "./App.tsx";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AppWrapper />
	</StrictMode>,
);
