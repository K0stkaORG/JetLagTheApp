module.exports = {
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: "module",
	},
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	plugins: ["@typescript-eslint"],
	env: {
		node: true,
		es2022: true,
	},
	rules: {
		"no-mixed-spaces-and-tabs": "off",
		"@typescript-eslint/no-explicit-any": "warn",
		"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
		"no-console": "warn",
		"no-restricted-imports": [
			"error",
			{
				patterns: [
					{
						group: ["@turf/turf"],
						message: "Use individual @turf/* packages instead (e.g. @turf/circle, @turf/buffer).",
					},
				],
			},
		],
	},
};
