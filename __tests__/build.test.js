import { describe, it } from "vitest";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

// Load .env.production manually
const envFilePath = path.resolve(process.cwd(), ".env.production");
const envVars = fs.existsSync(envFilePath)
  ? Object.fromEntries(
      fs
        .readFileSync(envFilePath, "utf-8")
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("#"))
        .map((line) => {
          const [key, ...value] = line.split("=");
          return [key.trim(), value.join("=").trim()];
        })
    )
  : {};

const bundlePath = envVars.VITE_WIDGET_DEV_PATH
  ? path.resolve(process.cwd(), envVars.VITE_WIDGET_DEV_PATH)
  : path.resolve(__dirname, "../dist/production/village-widget.js");

describe("Production bundle", () => {
  it("builds without errors and has valid JS syntax (IIFE)", () => {
    console.log("🚀 Running production build...");
    execSync("npm run build", { stdio: "inherit" });

    if (!fs.existsSync(bundlePath)) {
      throw new Error(`❌ IIFE bundle not found at: ${bundlePath}`);
    }

    console.log("🔎 Checking syntax for IIFE bundle");
    execSync(`node --check ${bundlePath}`, { stdio: "inherit" });
  });
});
