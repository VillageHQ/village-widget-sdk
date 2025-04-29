import path from "path";
import fs   from "fs";
import { defineConfig }      from "vitest/config";
import { loadEnv }           from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";   // npm i -D vite-plugin-css-injected-by-js

// ──────────────────────────────
// Project metadata (package.json)
// ──────────────────────────────
const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
);

export default defineConfig(({ mode }) => {
  const isWatch = process.argv.includes("--watch");

  // ──────────────────────────────
  // Load the correct .env file
  // ──────────────────────────────
  const envFile = isWatch
    ? path.resolve(process.cwd(), ".env.development")
    : path.resolve(process.cwd(), ".env.production");

  const parsedEnv = fs.existsSync(envFile)
    ? Object.fromEntries(
        fs
          .readFileSync(envFile, "utf-8")
          .split("\n")
          .filter(l => l.trim() && !l.startsWith("#"))
          .map(l => {
            const [k, ...v] = l.split("=");
            return [k.trim(), v.join("=").trim()];
          })
      )
    : {};

  // ──────────────────────────────
  // Resolve output paths
  // ──────────────────────────────
  let devFileFullPath = "";
  const outputDir = (() => {
    if (parsedEnv.VITE_WIDGET_DEV_PATH) {
      const full = path.resolve(process.cwd(), parsedEnv.VITE_WIDGET_DEV_PATH);
      if (!full.endsWith(".js")) throw new Error("VITE_WIDGET_DEV_PATH must be a .js file");
      devFileFullPath = full;
      return path.dirname(full);
    }
    devFileFullPath = path.resolve(__dirname, "dist/dev/village-widget-dev.js");
    return isWatch
      ? path.resolve(__dirname, "dist/dev")
      : path.resolve(__dirname, "dist/prod");
  })();

  // ──────────────────────────────
  // Banner plugin (date + version)
  // ──────────────────────────────
  const addBannerPlugin = {
    name: "banner",
    writeBundle() {
      const banner = `// Deployed: ${new Date().toISOString()}\n// Version: ${pkg.version}\n`;
      if (fs.existsSync(devFileFullPath)) {
        const code = fs.readFileSync(devFileFullPath, "utf8");
        if (!code.startsWith("// Deployed:")) {
          fs.writeFileSync(devFileFullPath, banner + code);
          console.log("✅ Banner prepended");
        }
      }
    },
  };

  // ──────────────────────────────
  // Vite configuration
  // ──────────────────────────────
  return {
    define: {
      global: "window",
      __DEV_WIDGET_PATH__: JSON.stringify(devFileFullPath),
      ...Object.fromEntries(
        Object.entries(parsedEnv).map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)])
      ),
    },

    resolve: { alias: { "@": path.resolve(__dirname, "src") } },

    build: {
      // ensure CSS is not split and all assets are inlined
      cssCodeSplit: false,
      assetsInlineLimit: Infinity,

      lib: {
        entry: path.resolve(__dirname, "src/index.js"),
        name: "VillageWidgetSDK",
        formats: ["iife"],
        fileName: () => path.basename(devFileFullPath),
      },

      rollupOptions: {
        input: path.resolve(__dirname, "src/index.js"),
        output: {
          extend: true,
          exports: "named",
          inlineDynamicImports: true,
          dir: path.dirname(devFileFullPath),
          entryFileNames: path.basename(devFileFullPath),
        },
      },

      watch: isWatch ? {} : null,
      minify: !isWatch,
      sourcemap: isWatch,
      outDir: outputDir,
      emptyOutDir: false,
    },

    plugins: [
      cssInjectedByJsPlugin(), // ← injects CSS at runtime
      addBannerPlugin,
    ],

    test: {
      environment: "jsdom",
      globals: true,
      coverage: { reporter: ["text", "html"] },
      alias: { "@": path.resolve(__dirname, "../../") },
    },
  };
});
