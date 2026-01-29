#!/usr/bin/env node

/**
 * Fix for Expo SDK 53 ExpoFetchModule compilation issue
 * Removes ExpoFetchModule from Android modules in expo-module.config.json
 */

const fs = require("fs");
const path = require("path");

// Find the root of the monorepo (where node_modules is)
const findRoot = () => {
  let currentDir = __dirname;
  while (currentDir !== path.dirname(currentDir)) {
    const nodeModulesPath = path.join(currentDir, "node_modules", "expo");
    if (require("fs").existsSync(nodeModulesPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  // Fallback: try relative to script location
  return path.join(__dirname, "../..");
};

const rootDir = findRoot();
const expoModuleConfigPath = path.join(
  rootDir,
  "node_modules",
  "expo",
  "expo-module.config.json",
);

try {
  if (fs.existsSync(expoModuleConfigPath)) {
    const config = JSON.parse(fs.readFileSync(expoModuleConfigPath, "utf8"));

    // Remove ExpoFetchModule from Android modules
    if (config.android && config.android.modules) {
      config.android.modules = config.android.modules.filter(
        (module) => !module.includes("fetch"),
      );
    }

    fs.writeFileSync(
      expoModuleConfigPath,
      JSON.stringify(config, null, 2) + "\n",
      "utf8",
    );

    console.log(
      "✅ Fixed expo-module.config.json - removed ExpoFetchModule from Android modules",
    );
  } else {
    console.log("⚠️  expo-module.config.json not found, skipping fix");
  }
} catch (error) {
  console.error("❌ Error fixing expo-module.config.json:", error.message);
  process.exit(1);
}
