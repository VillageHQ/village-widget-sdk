import path from "path";
import fs from "fs";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "./package.json"), "utf-8")
);



export default defineConfig(({ mode }) => {
  // Load environment variables from .env based on the current mode
  const env = loadEnv(mode, process.cwd(), "");

  // Detect if the --watch flag is present (used in dev mode)
  const isWatch = process.argv.includes("--watch");

  /**
   * Full path where the development bundle is written when using `--watch`.
   * Can be overridden using VITE_WIDGET_DEV_PATH in .env file.
   */
  const devFileFullPath =
    env.VITE_WIDGET_DEV_PATH ??
    path.resolve(__dirname, "../../../public/village-widget-dev.js");

  // Set output directory: use target file's directory for watch mode, else use local dist/
  const outputDir = isWatch
    ? path.dirname(devFileFullPath)
    : path.resolve(__dirname, "dist");

  /**
   * Custom plugin to prepend deployment banner (date + version) at the top of the dev bundle.
   * Runs only when using --watch mode.
   */
  const addBannerPlugin = {
    name: "add-banner-comment",
    writeBundle() {
      const deployDate = new Date().toISOString();
      const banner = `// Deployed: ${deployDate}\n// Version: ${pkg.version}\n`;
      const targetFile = devFileFullPath;

      if (fs.existsSync(targetFile)) {
        const original = fs.readFileSync(targetFile, "utf8");
        fs.writeFileSync(targetFile, banner + original);
        console.log(`✅ Banner added to ${targetFile}`);
      }
    },
  };

  return {
    // ---------- Vite build settings ----------
    define: {
      global: "window",
      // Expose the dev file path as a global constant for runtime usage
      __DEV_WIDGET_PATH__: JSON.stringify(devFileFullPath),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),  // Shortcut for project root
      },
    },
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, "src/index.js"),
        output: {
          format: "iife", // Immediately Invoked Function Expression for browser compatibility
          name: "Village", // Global variable name for the widget
          dir: outputDir, // Output directory
          entryFileNames: isWatch ? path.basename(devFileFullPath) : "index.js", // Use custom filename in watch mode
          extend: true, // Extend global variable instead of overwriting
          exports: 'named',
        },
      },
      watch: isWatch ? {} : null,
      minify: !isWatch,
      sourcemap: isWatch,
    },
    plugins: isWatch ? [addBannerPlugin] : [],

    // ---------- Vitest test settings ----------
    test: {
      environment: "jsdom", // Simulate browser-like DOM environment
      globals: true, // Enable global functions like `describe`, `it`, `expect` without imports
      setupFiles: "./__tests__/setup.ts", // Path to global setup file
      coverage: {
        reporter: ["text", "html"], // Output test coverage to terminal and HTML file
      },
      alias: {
        "@": path.resolve(__dirname, "../../"), // Alias for imports in tests
      },
    },
  };
});
