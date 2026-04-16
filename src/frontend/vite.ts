import type { UserConfig } from "vite";

export default {
	build: {
		outDir: "../../build/frontend",
		emptyOutDir: true,

		rolldownOptions: {
			output: {
				entryFileNames: "[name].js",
				assetFileNames: "[name].[ext]",
			},
		},
	},
} satisfies UserConfig;
