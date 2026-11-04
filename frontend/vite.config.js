import { defineConfig } from "vite";

export default defineConfig({
	logLevel: "error",

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
