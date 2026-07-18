import "./index.css";

import AppWrapper from "./App.tsx";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

loader.config({ monaco });

document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AppWrapper />
	</StrictMode>,
);
