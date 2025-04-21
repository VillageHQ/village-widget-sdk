import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const isWatch = process.argv.includes("--watch");
  const outputDir = isWatch
    ? path.resolve(__dirname, "../../../public") // Corrected path to frontend-web/public
    : path.resolve(__dirname, "dist"); // Keep dist for production builds

  return {
    define: {
      global: "window",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "../../"),
      },
    },
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, "index.js"),
        output: {
          format: "iife",
          name: "Village",
          dir: outputDir, // Use the determined output directory
          entryFileNames: isWatch ? "village-widget-dev.js" : "index.js",
          extend: true,
        },
      },
      watch: isWatch ? {} : null,
      minify: !isWatch,
      sourcemap: isWatch,
    },
  };
});
