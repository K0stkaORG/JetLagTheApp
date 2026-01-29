const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const buildType = process.argv[2];

if (!buildType || !["dev", "release"].includes(buildType)) {
	console.error("Usage: node apps/mobile/scripts/mobile-android-build.js <dev|release>");
	process.exit(1);
}

const mobileRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(mobileRoot, "..", "..");
const outputDir = path.join(mobileRoot, "output");

fs.mkdirSync(outputDir, { recursive: true });

const dockerArgs = [
	"run",
	"--rm",
	"-e",
	`BUILD_TYPE=${buildType}`,
	"-v",
	`${repoRoot}:/repo`,
	"-v",
	`${outputDir}:/output`,
	"jetlag-mobile-builder",
];

const result = spawnSync("docker", dockerArgs, { stdio: "inherit" });

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}

process.exit(result.status ?? 0);
