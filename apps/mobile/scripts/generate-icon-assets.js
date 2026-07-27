const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const MOBILE_DIR = path.resolve(__dirname, "..");
const IMAGES_DIR = path.join(MOBILE_DIR, "assets", "images");
const LOGO_SVG = path.join(IMAGES_DIR, "logo.svg");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function main() {
  if (!fs.existsSync(LOGO_SVG)) {
    console.error(`Logo SVG not found at ${LOGO_SVG}`);
    process.exit(1);
  }

  ensureDir(IMAGES_DIR);

  const svg = fs.readFileSync(LOGO_SVG, "utf8");
  // The SVG has a light gray inner hexagon. Make it white so it works on
  // white/gray icon and splash backgrounds.
  const whiteSvg = svg.replace(/fill="#F0F0F0"/, 'fill="#FFFFFF"');
  const whiteSvgPath = path.join(IMAGES_DIR, "logo-white.svg");
  fs.writeFileSync(whiteSvgPath, whiteSvg);

  // Render a high-resolution transparent logo once.
  const hiResLogo = path.join(IMAGES_DIR, "logo-white-1024.png");
  run(`rsvg-convert -w 1024 -h 1024 "${whiteSvgPath}" -o "${hiResLogo}"`);

  const composite = (size, bg, logoSize, outName) => {
    const output = path.join(IMAGES_DIR, outName);
    const bgSpec = bg === "transparent" ? "xc:none" : `xc:"${bg}"`;
    const resizeSpec = logoSize ? `"${hiResLogo}" -resize ${logoSize}x${logoSize}` : `"${hiResLogo}"`;
    if (logoSize) {
      run(`convert -size ${size}x${size} ${bgSpec} ${resizeSpec} -gravity center -composite "${output}"`);
    } else {
      run(`convert -size ${size}x${size} ${bgSpec} "${output}"`);
    }
  };

  // Generic / iOS / web app icon.
  composite(1024, "#FFFFFF", 600, "icon.png");
  // Android adaptive icon foreground.
  composite(1024, "transparent", 600, "android-icon-foreground.png");
  // Android adaptive icon background.
  composite(1024, "#FFFFFF", 0, "android-icon-background.png");
  // Splash icon (background is configured in app.json).
  composite(1024, "transparent", 700, "splash-icon.png");
  // Web favicon.
  composite(512, "#FFFFFF", 300, "favicon.png");

  // Clean up temporary render files.
  fs.unlinkSync(whiteSvgPath);
  fs.unlinkSync(hiResLogo);

  console.log("Icon assets generated successfully in", IMAGES_DIR);
}

main();
