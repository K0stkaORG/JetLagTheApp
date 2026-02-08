import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { FullScreenLoader } from "@/screens/Loading.Screen";
import { RevalidateResponse } from "@jetlag/shared-types";
import { toast } from "sonner";
import { useServer } from "./server";

const LocalStorageKey = "admin_token";

const AuthContext = createContext<{
	token: string | null;
	updateToken: (token: string | null) => void;
}>({
	token: null,
	updateToken: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const storedToken = localStorage.getItem(LocalStorageKey);

		if (storedToken) setToken(storedToken);

		setLoading(false);

		if (storedToken) revalidateToken(storedToken);
	}, []);

	const updateToken = useCallback((newToken: string | null) => {
		if (newToken) localStorage.setItem(LocalStorageKey, newToken);
		else localStorage.removeItem(LocalStorageKey);

		setToken(newToken);
	}, []);

	const revalidateToken = useCallback(async (token: string) => {
		const response = await useServer<void, RevalidateResponse>({
			path: "/revalidate",
			token,
		});

		if (response.result !== "success") {
			toast.error("Session expired. Please log in again.");
			updateToken(null);
			return;
		}

		updateToken(response.data.token);
	}, []);

	if (loading) return <FullScreenLoader />;

	return <AuthContext.Provider value={{ token, updateToken }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): { token: string } => {
	const ctx = useContext(AuthContext);

	if (!ctx || !ctx.token) throw new Error("useAuth must be used within an AuthProvider with a valid token");

	return ctx as { token: string };
};

export const useAuthContext = () => {
	return useContext(AuthContext);
};

export const getToken = (): string => localStorage.getItem(LocalStorageKey)!;
