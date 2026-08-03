import { NicknameSchema, PasswordSchema, User } from "../models/user";

import { z } from "zod";

export const LoginRequest = z.object({
	nickname: z.string().min(1, "Nickname is required"),
	password: z.string().min(1, "Password is required"),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export type LoginResponse = {
	token: string;
	user: User;
};

export const RegisterRequest = z.object({
	nickname: NicknameSchema,
	password: PasswordSchema,
});
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export type RevalidateResponse = {
	token: string;
};
