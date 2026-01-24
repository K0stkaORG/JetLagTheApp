import { NicknameSchema, PasswordSchema, User } from "../models/user";

import { z } from "zod";

export const LoginRequest = z.object({
	nickname: NicknameSchema,
	password: z.string().min(1, "Password is required"),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export type LoginResponse = {
	result: "success";
	token: string;
	user: User;
};

export const RegisterRequest = z.object({
	nickname: NicknameSchema,
	password: PasswordSchema,
});
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export type RegisterResponse = void;

export type RevalidateResponse = {
	token: string;
};
