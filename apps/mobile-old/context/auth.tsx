import { createContext, use, useCallback, useEffect, useState } from "react";

import { PersistentStorage } from "~/services/persistentStorage";
import { SecureStore } from "~/services/secureStore";
import Spinner from "~/components/ui/Spinner";
import { User } from "~/types/models";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { useServer } from "~/services/server";

type AuthContextType = {
    isAuthenticated: boolean;
    user: User | null;
    register: (details: LoginDetails) => Promise<void>;
    login: (details: LoginDetails) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
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

    const refreshInfo = useCallback(async (token: string) => {
        const id = toast.loading("Aktualizuji uživatelské informace...", {
            dismissible: false,
            duration: Infinity,
        });

        await new Promise<void>(async (resolve) => {
            const response = await useServer<User | "reset-auth">("/auth/refresh", {
                token,
            });

            if (!response.success) {
                if (response.result === "network-error") {
                    response.consumeError();
                    resolve();
                    return;
                } else return await logout().then(response.consumeError).then(resolve);
            }

            if (response.data === "reset-auth") return await logout().then(resolve);

            setUser(response.data);

            resolve();
        });

        toast.dismiss(id);
    }, []);

    const logout = useCallback(async () => {
        await Promise.allSettled([
            SecureStore.remove("user"),
            PersistentStorage.removeGameContext(),
        ]);

        setIsAuthenticated(false);
        setUser(null);

        router.replace("/login");
    }, []);

    const register = useCallback(async (loginDetails: LoginDetails) => {
        const response = await useServer<void>("/auth/register", {
            body: loginDetails,
        });

        if (!response.success) return response.consumeError();

        toast.success("Účet úspěšně vytvořen! Můžete se přihlásit.");

        router.replace("/login");
    }, []);

    const login = useCallback(async (loginDetails: LoginDetails) => {
        const response = await useServer<User>("/auth/login", {
            body: loginDetails,
        });

        if (!response.success) return response.consumeError();

        await SecureStore.set("user", JSON.stringify(response.data));

        setIsAuthenticated(true);
        setUser(response.data);

        router.replace("/");
    }, []);

    const refresh = useCallback(async () => {
        if (!user) return;

        await refreshInfo(user.token);
    }, [user, refreshInfo]);

    useEffect(() => {
        const readSecureStorage = async () => {
            const storedUser = await SecureStore.get("user");

            if (storedUser) {
                setIsAuthenticated(true);

                const parsedUser = JSON.parse(storedUser) as User;

                setUser(parsedUser);

                refreshInfo(parsedUser.token);
            }

            setLoading(false);
        };

        readSecureStorage();
    }, [refreshInfo]);

    if (loading) return <Spinner fullscreen />;

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                register,
                login,
                logout,
                refresh,
            }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => use(AuthContext);

export const useUser = () => useAuth().user as User;
export const useToken = () => useAuth().user?.token;

export const useTokenAsync = async (): Promise<string | undefined> =>
    SecureStore.get("user").then((user) => user && JSON.parse(user).token);
