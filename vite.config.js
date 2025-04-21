import path from "path";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load environment variables from .env file so tests have access
  const env = loadEnv(mode, process.cwd(), "");

  // Detect Vite build --watch flag (when running `npm run dev`)
  const isWatch = process.argv.includes("--watch");

  /**
   * Full path where the dev bundle is written when `--watch` is enabled.
   * You can override with VITE_WIDGET_DEV_PATH in your .env.
   */
  const devFileFullPath =
    env.VITE_WIDGET_DEV_PATH ??
    path.resolve(__dirname, "../../../public/village-widget-dev.js");

  // Decide output directory based on the current build mode
  const outputDir = isWatch
    ? path.dirname(devFileFullPath)
    : path.resolve(__dirname, "dist");

  return {
    // ---------------- Vite build settings ----------------
    define: {
      global: "window",
      // Expose the dev file path inside the bundle (useful for runtime)
      __DEV_WIDGET_PATH__: JSON.stringify(devFileFullPath),
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
          dir: outputDir,
          entryFileNames: isWatch ? path.basename(devFileFullPath) : "index.js",
          extend: true,
        },
      },
      watch: isWatch ? {} : null,
      minify: !isWatch,
      sourcemap: isWatch,
    },

    // ---------------- Vitest settings -------------------
    test: {
      environment: "jsdom",          // Simulate browser for DOM APIs
      globals: true,                 // Allows describe/it/expect without imports
      setupFiles: "./__tests__/setup.ts", // Global mocks + polyfills
      coverage: {
        reporter: ["text", "html"], // Show coverage summary & HTML report
      },
      // Makes TypeScript paths/@ imports work inside tests
      alias: {
        "@": path.resolve(__dirname, "../../"),
      },
    },
  };
});
