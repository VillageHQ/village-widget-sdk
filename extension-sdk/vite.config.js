import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.js"),
      name: "VillageExtension",
      fileName: (format) => `index.${format === "es" ? "mjs" : "js"}`,
    },
    rollupOptions: {
      external: ["axios"],
      output: {
        exports: "named",
        globals: {
          axios: "axios",
        },
      },
    },
    // Copy TypeScript declaration file to dist folder after build
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [
    {
      name: "copy-d-ts",
      closeBundle() {
        fs.copyFileSync(
          resolve(__dirname, "src/index.d.ts"),
          resolve(__dirname, "dist/index.d.ts")
        );
      },
    },
  ],
});
