import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig(({ mode }) => {
  const envFile = resolve(process.cwd(), `.env.${mode}`);

  const parsedEnv = fs.existsSync(envFile)
    ? Object.fromEntries(
        fs
          .readFileSync(envFile, "utf-8")
          .split("\n")
          .filter((l) => l.trim() && !l.startsWith("#"))
          .map((l) => {
            const [k, ...v] = l.split("=");
            return [k.trim(), v.join("=").trim()];
          })
      )
    : {};

  return {
    build: {
      lib: {
        entry: resolve(__dirname, "src/village-module.js"),
        name: "VillageWidget",
        fileName: (format) => `index.${format === "es" ? "mjs" : "js"}`,
        formats: ["es", "umd"],
      },
      rollupOptions: {
        output: {
          exports: "named",
          inlineDynamicImports: true,
        },
      },
      outDir: "dist",
      emptyOutDir: false,
    },
    plugins: [
      cssInjectedByJsPlugin(),
      {
        name: "copy-d-ts",
        closeBundle() {
          // Copy TypeScript declaration file to dist folder after build
          if (fs.existsSync(resolve(__dirname, "dist/index.d.ts"))) {
            // Already exists, don't overwrite
            return;
          }
          fs.copyFileSync(
            resolve(__dirname, "src/index.d.ts"),
            resolve(__dirname, "dist/index.d.ts")
          );
        },
      },
    ],
    define: {
      global: "window",
      ...Object.fromEntries(
        Object.entries(parsedEnv).map(([k, v]) => [
          `import.meta.env.${k}`,
          JSON.stringify(v),
        ])
      ),
    },
    resolve: { alias: { "@": resolve(__dirname, "src") } },
  };
});
