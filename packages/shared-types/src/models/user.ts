import z from "zod";

export const NicknameSchema = z
	.string()
	.min(1, "Nickname is required")
	.min(3, "Nickname must be at least 3 characters")
	.max(30, "Nickname must be at most 30 characters");

export const PasswordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.regex(/\d/, "Password must contain at least one digit")
	.regex(/\p{Ll}/u, "Password must contain at least one lowercase letter")
	.regex(/\p{Lu}/u, "Password must contain at least one uppercase letter");

export type User = {
	id: number;
	nickname: string;
	colors: {
		light: string;
		dark: string;
	};
};
