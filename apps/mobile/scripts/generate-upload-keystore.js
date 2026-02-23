const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

async function main() {
  const mobileRoot = path.resolve(__dirname, "..");
  const androidRoot = path.join(mobileRoot, "android");
  const keystorePath = path.join(androidRoot, "app", "upload-keystore.jks");
  const keystorePropertiesPath = path.join(androidRoot, "keystore.properties");

  const keytoolCheck = spawnSync("keytool", ["-help"], { stdio: "ignore" });
  if (keytoolCheck.error || keytoolCheck.status !== 0) {
    console.error(
      "keytool not found. Install a JDK (Java 17+) and ensure `keytool` is on PATH.",
    );
    process.exit(1);
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });

  let shouldOverwrite = true;
  if (fs.existsSync(keystorePath)) {
    const overwriteAnswer = await rl.question(
      "upload-keystore.jks already exists. Overwrite it? (y/N): ",
    );
    shouldOverwrite = overwriteAnswer.trim().toLowerCase() === "y";
  }

  if (!shouldOverwrite) {
    rl.close();
    console.log("Cancelled. Existing keystore was not changed.");
    process.exit(0);
  }

  const aliasAnswer = await rl.question("Key alias [upload]: ");
  const keyAlias = aliasAnswer.trim() || "upload";
  rl.close();

  fs.mkdirSync(path.dirname(keystorePath), { recursive: true });

  console.log("\nGenerating upload keystore...");
  console.log("keytool will now ask for passwords and certificate details.");

  const keytoolArgs = [
    "-genkeypair",
    "-v",
    "-storetype",
    "PKCS12",
    "-keystore",
    keystorePath,
    "-alias",
    keyAlias,
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "10000",
  ];

  const keytoolRun = spawnSync("keytool", keytoolArgs, { stdio: "inherit" });
  if (keytoolRun.error) {
    console.error(`Failed to execute keytool: ${keytoolRun.error.message}`);
    process.exit(1);
  }
  if (keytoolRun.status !== 0) {
    process.exit(keytoolRun.status);
  }

  if (!fs.existsSync(keystorePropertiesPath)) {
    const propertiesTemplate = [
      "# Local release signing config (DO NOT COMMIT)",
      "# Fill passwords with the values you entered in keytool.",
      "storeFile=app/upload-keystore.jks",
      "storePassword=CHANGE_ME",
      `keyAlias=${keyAlias}`,
      "keyPassword=CHANGE_ME",
      "",
    ].join("\n");

    fs.writeFileSync(keystorePropertiesPath, propertiesTemplate, "utf8");
    console.log(
      `Created ${path.relative(process.cwd(), keystorePropertiesPath)}.`,
    );
  } else {
    console.log("keystore.properties already exists. Leaving it unchanged.");
  }

  console.log("\nUpload key setup complete.");
  console.log(
    "Next: update android/keystore.properties passwords, then run `pnpm build:mobile:release`.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
