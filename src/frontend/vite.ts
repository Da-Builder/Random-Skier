import type { UserConfig } from "vite";

export default {
	build: {
		rolldownOptions: {
			output: {
				entryFileNames: "[name].js",
				assetFileNames: "[name].[ext]",
			},
		},
	},
} satisfies UserConfig;
