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
    path.resolve(__dirname, "./dist/dev/index-dev.js");

  // Set output directory: use target file's directory for watch mode, else use local dist/
  const outputDir = isWatch
    ? path.resolve(__dirname, "dist/dev")
    : path.resolve(__dirname, "dist/prod");


  /**
   * Custom plugin to prepend deployment banner (date + version) at the top of the dev bundle.
   * Runs only when using --watch mode.
   */
  const addBannerPlugin = {
    name: "add-banner-comment",
    writeBundle(options) {
      const deployDate = new Date().toISOString();
      const banner = `// Deployed: ${deployDate}\n// Version: ${pkg.version}\n`;

      const addBanner = (filePath) => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf8");

          // ✅ Check if banner already exists
          if (!content.startsWith("// Deployed:")) {
            fs.writeFileSync(filePath, banner + content);
            console.log(`✅ Banner added to ${filePath}`);
          } else {
            console.log(`ℹ️ Banner already exists in ${filePath}, skipping.`);
          }
        }
      };

      if (isWatch) {
        // Development mode: target dev file
        addBanner(devFileFullPath);
      } else {
        // Production mode: target built files
        const prodFiles = [
          path.resolve(outputDir, "index.es.js"),
          path.resolve(outputDir, "index.umd.js"),
        ];
        for (const file of prodFiles) {
          addBanner(file);
        }
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
      emptyOutDir: false,
    },
    plugins: [addBannerPlugin],

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
