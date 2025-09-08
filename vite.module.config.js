import path from "path";
import fs from "fs";
import { defineConfig } from "vitest/config";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig(({ mode }) => {
  const envFile = path.resolve(process.cwd(), `.env.${mode}`);

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
      cssCodeSplit: false,
      assetsInlineLimit: Infinity,

      lib: {
        entry: path.resolve(__dirname, "src/village-module.js"),
        name: "VillageModule",
        formats: ["es"],
        fileName: () => parsedEnv.VITE_WIDGET_DEV_PATH ? "village-module" : "village-module",
      },

      rollupOptions: {
        output: {
          exports: "named",
          inlineDynamicImports: true,
        },
      },

      outDir: parsedEnv.VITE_WIDGET_DEV_PATH ? 
        path.resolve(parsedEnv.VITE_WIDGET_DEV_PATH, "..") : 
        path.resolve(__dirname, `dist/${mode}`),
      emptyOutDir: false,
    },

    plugins: [
      cssInjectedByJsPlugin(),
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

    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  };
});
