import { createContext, use, useEffect, useState } from "react";

import { Loader2 } from "lucide-react-native";
import { SecureStore } from "~/services/secureStore";
import { T } from "~/components/ui/text";
import { User } from "~/lib/types";

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
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading delay

            try {
                const storedUser = await SecureStore.get("user");

                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error("Error reading secure storage:", error);
            }

            setLoading(false);
        };
        readSecureStorage();
    }, []);

    const login = async ({ nickname, password }: LoginDetails) => {
        if (false) throw new Error("Invalid credentials");

        const id = Math.random().toString(36).substring(2, 15);

        const user = { id, nickname };

        await SecureStore.set("user", JSON.stringify(user));

        setIsAuthenticated(true);
        setUser(user);
    };

    const logout = async () => {
        await SecureStore.remove("user");

        setIsAuthenticated(false);
        setUser(null);
    };

    if (loading) return <T>Loading session info</T>;

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
