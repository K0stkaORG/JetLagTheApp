var fs = require("fs");

console.log("Clearing build artifacts...");

try {
	fs.rmdirSync("./dist", { recursive: true });
} catch (e) {
	console.warn("Error when removing folder: ./dist: ", e.message);
}

console.log("Building application...");

process.exit(0);
