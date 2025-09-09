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
          // Ensure up-to-date types in dist
          const src = resolve(__dirname, "src/index.d.ts");
          const destDir = resolve(__dirname, "dist");
          const dest = resolve(destDir, "index.d.ts");
          
          if (!fs.existsSync(src)) return; // nothing to copy
          
          fs.mkdirSync(destDir, { recursive: true });
          fs.copyFileSync(src, dest); // always overwrite to prevent stale d.ts
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
