import { createContext, use, useEffect, useState } from "react";

import { SecureStore } from "~/services/secureStore";
import Spinner from "~/components/Spinner";
import { User } from "~/types/types";
import { router } from "expo-router";
import { useServer } from "~/services/server";

type AuthContextType = {
    isAuthenticated: boolean;
    user: User | null;
    login: (details: LoginDetails) => Promise<void>;
    logout: () => Promise<void>;
};

type LoginDetails = {
    nickname: string;
    password: string;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const readSecureStorage = async () => {
            const storedUser = await SecureStore.get("user");

            if (storedUser) {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            }

            setLoading(false);
        };

        readSecureStorage();
    }, []);

    const register = async (loginDetails: LoginDetails) => {
        const response = await useServer<void>("/auth/register", loginDetails);

        if (!response.success) return response.consumeError();
    };

    const login = async (loginDetails: LoginDetails) => {
        const response = await useServer<User>("/auth/login", loginDetails);

        if (!response.success) return response.consumeError();

        await SecureStore.set("user", JSON.stringify(response.data));

        setIsAuthenticated(true);
        setUser(response.data);

        router.replace("/");
    };

    const logout = async () => {
        await SecureStore.remove("user");

        setIsAuthenticated(false);
        setUser(null);

        router.replace("/login");
    };

    if (loading) return <Spinner fullscreen />;

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                login,
                logout,
            }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => use(AuthContext);

export const useUser = () => useAuth().user as User;
