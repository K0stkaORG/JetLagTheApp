import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react({
			compiler: true,
		}),
		tailwindcss(),
		VitePWA({
			registerType: "prompt",
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
				manualChunks(id) {
					if (!id.includes("node_modules")) return undefined;
					if (id.includes("leaflet")) return "leaflet";
					if (id.includes("@monaco-editor")) return "monaco";
					if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "vendor";
					return undefined;
				},
			},
		},
	},
});
