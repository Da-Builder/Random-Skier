import { defineConfig } from "vite";

export default defineConfig({
	logLevel: "error",
	publicDir: "assets/",

	build: {
		outDir: "build/",
		rolldownOptions: {
			output: {
				entryFileNames: "[name].js",
				assetFileNames: "[name].[ext]",
			},
		},
	},
});
