import { z } from "zod";

const UsernameSchema = z
	.string()
	.min(1, "Username is required")
	.min(3, "Username must be at least 3 characters")
	.max(30, "Username must be at most 30 characters");
const PasswordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.regex(/\d/, "Password must contain at least one digit")
	.regex(/\p{Ll}/u, "Password must contain at least one lowercase letter")
	.regex(/\p{Lu}/u, "Password must contain at least one uppercase letter");

const TokenSchema = z.string().min(1, "Token is required").length(64, "Token must be 64 characters long");

export const LoginRequest = z.object({
	username: UsernameSchema,
	password: PasswordSchema,
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const LoginResponse = z.union([
	z.object({
		result: "success",
		token: TokenSchema,
	}),
	z.object({
		result: "error",
		message: z.string(),
	}),
]);
export type LoginResponse = z.infer<typeof LoginResponse>;

export const RegisterRequest = z.object({
	username: UsernameSchema,
	password: PasswordSchema,
});
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export const RegisterResponse = z.union([
	z.object({
		result: "success",
		token: TokenSchema,
	}),
	z.object({
		result: "error",
		message: z.string(),
	}),
]);
export type RegisterResponse = z.infer<typeof RegisterResponse>;
