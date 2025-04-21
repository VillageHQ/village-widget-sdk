const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function incrementVersion(version) {
  const parts = version.split(".");
  parts[2] = (parseInt(parts[2]) + 1).toString();
  return parts.join(".");
}

function checkEnvFile() {
  const envPath = path.join(__dirname, "..", ".env.production");
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env.production file is missing!");
    process.exit(1);
  }
  console.log("✅ .env.production file exists");
}

function updatePackageVersion() {
  const packagePath = path.join(__dirname, "..", "package.json");
  const package = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const oldVersion = package.version;
  package.version = incrementVersion(oldVersion);

  fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));
  console.log(`✅ Version updated from ${oldVersion} to ${package.version}`);
  return package.version;
}

async function deploy() {
  try {
    // Check .env.production exists
    checkEnvFile();

    // Update version
    const newVersion = updatePackageVersion();

    // Build
    console.log("Building widget...");
    execSync("npm run build", { stdio: "inherit" });
    console.log("✅ Build completed");

    // Publish
    console.log("Publishing to npm...");
    execSync("npm publish --access public", { stdio: "inherit" });
    console.log(`✅ Successfully published version ${newVersion}`);
  } catch (error) {
    console.error("Deploy failed:", error.message);
    process.exit(1);
  }
}

deploy();
