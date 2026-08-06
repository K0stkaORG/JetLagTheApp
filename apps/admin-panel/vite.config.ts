import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "JetLag: Admin Panel",
				short_name: "JetLag: Admin",
				description: "Admin panel for managing JetLag: The App server",
				start_url: "/",
				background_color: "#213042",
				theme_color: "#213042",
				icons: [
					{
						src: "/logo_192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "/logo.png",
						sizes: "512x512",
						type: "image/png",
					},
				],
				screenshots: [
					{
						src: "/mockup.png",
						sizes: "856x1816",
						form_factor: "narrow",
						type: "image/png",
					},
					{
						src: "/mockup_wide.png",
						sizes: "1907x1197",
						form_factor: "wide",
						type: "image/png",
					},
				],
				display: "standalone",
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				skipWaiting: true,
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
		dedupe: ["react", "react-dom"],
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					leaflet: ["leaflet"],
					monaco: ["@monaco-editor/react"],
					vendor: ["react", "react-dom", "react-router"],
				},
			},
		},
	},
});
