import path from "path";
import fs from "fs";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "./package.json"), "utf-8")
);

export default defineConfig(({ mode }) => {
  const isWatch = process.argv.includes("--watch");

  // 👉 Manually load the correct .env file (force development or production)
  const envFile = isWatch
    ? path.resolve(process.cwd(), ".env.development")
    : path.resolve(process.cwd(), ".env.production");

  const parsedEnv = fs.existsSync(envFile)
    ? Object.fromEntries(
        fs
          .readFileSync(envFile, "utf-8")
          .split("\n")
          .filter(line => line.trim() && !line.startsWith("#"))
          .map(line => {
            const [key, ...value] = line.split("=");
            return [key.trim(), value.join("=").trim()];
          })
      )
    : {};

  // Full path for the dev bundle
  const devFileFullPath =
    parsedEnv.VITE_WIDGET_DEV_PATH ??
    path.resolve(__dirname, "./dist/dev/index-dev.js");

  // Output directory depending on mode
  const outputDir = isWatch
    ? path.resolve(__dirname, "dist/dev")
    : path.resolve(__dirname, "dist/prod");

  // Custom plugin to add a deployment banner to the generated files
  const addBannerPlugin = {
    name: "add-banner-comment",
    writeBundle() {
      const deployDate = new Date().toISOString();
      const banner = `// Deployed: ${deployDate}\n// Version: ${pkg.version}\n`;

      const addBanner = (filePath) => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf8");
          if (!content.startsWith("// Deployed:")) {
            fs.writeFileSync(filePath, banner + content);
            console.log(`✅ Banner added to ${filePath}`);
          } else {
            console.log(`ℹ️ Banner already exists in ${filePath}, skipping.`);
          }
        }
      };

      if (isWatch) {
        addBanner(devFileFullPath);
      } else {
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
    define: {
      global: "window",
      __DEV_WIDGET_PATH__: JSON.stringify(devFileFullPath),
      // ✅ Inject all env variables as import.meta.env.*
      ...Object.fromEntries(
        Object.entries(parsedEnv).map(([key, value]) => [
          `import.meta.env.${key}`,
          JSON.stringify(value),
        ])
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, "src/index.js"),
        name: "VillageWidgetSDK",
        formats: isWatch ? ['iife'] : ['es', 'umd'],
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
        },
      },
      watch: isWatch ? {} : null,
      minify: !isWatch,
      sourcemap: isWatch,
      outDir: outputDir,
      emptyOutDir: false,
    },
    plugins: [addBannerPlugin],
    test: {
      environment: "jsdom",
      globals: true,
      coverage: {
        reporter: ["text", "html"],
      },
      alias: {
        "@": path.resolve(__dirname, "../../"),
      },
    },
  };
});
