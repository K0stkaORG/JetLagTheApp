import { compare, hash } from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => hash(password, 12);

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> =>
	compare(password, hashedPassword);
