import z from "zod";

export const AdminLoginRequest = z.object({
	username: z.string().min(1, "Username is required"),
	password: z.string().min(1, "Password is required"),
});
export type AdminLoginRequest = z.infer<typeof AdminLoginRequest>;

export type AdminLoginResponse = {
	result: "success";
	token: string;
};
