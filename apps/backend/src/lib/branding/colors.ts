import { User } from "@jetlag/shared-types";

const hslToHex = (h: number, s: number, l: number) => {
	l /= 100;
	const a = (s * Math.min(l, 1 - l)) / 100;
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, "0");
	};
	return `#${f(0)}${f(8)}${f(4)}`;
};

export const getUserColors = (string: string): User["colors"] => {
	const normalizeHash = (hash: number, min: number, max: number): number => Math.floor((hash % (max - min)) + min);

	let hash = 0;

	for (let i = 0; i < string.length; i++) hash = string.charCodeAt(i) + ((hash << 5) - hash);
	hash = Math.abs(hash);

	const h = normalizeHash(hash, 0, 360);
	const s = normalizeHash(hash, 50, 90);

	return {
		light: hslToHex(h, s, normalizeHash(hash, 20, 40)),
		dark: hslToHex(h, s, normalizeHash(hash, 80, 90)),
	};
};
