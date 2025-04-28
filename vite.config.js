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
        "@": path.resolve(__dirname, "src"), // Shortcut for project root
      },
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, "src/index.js"),
        name: "VillageWidgetSDK",
        formats: isWatch ? ['iife'] : ['es', 'umd'], // 👈 Dev = iife | Prod = es + umd
        fileName: (format) => {
          if (isWatch) {
            return path.basename(devFileFullPath);
          }
          return format === "es" ? "index.es.js" : "index.umd.js";
        },
      },
      rollupOptions: {
        output: {
          extend: true,
          exports: 'named',
          globals: {
            // Declare external libraries here if needed
          },
        },
      },
      watch: isWatch ? {} : null,
      minify: !isWatch,
      sourcemap: isWatch,
      outDir: outputDir,
      emptyOutDir: !isWatch,
    },
    plugins: isWatch ? [addBannerPlugin] : [],

    // ---------- Vitest test settings ----------
    test: {
      environment: "jsdom", // Simulate browser-like DOM environment
      globals: true, // Enable global functions like `describe`, `it`, `expect` without imports
      coverage: {
        reporter: ["text", "html"], // Output test coverage to terminal and HTML file
      },
      alias: {
        "@": path.resolve(__dirname, "../../"), // Alias for imports in tests
      },
    },
  };
});
