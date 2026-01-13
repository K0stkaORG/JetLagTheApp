import Constants from "expo-constants";
import { z } from "zod";

const extra = Constants.expoConfig?.extra ?? {};

export const env = z
    .object(
        {
            EXPO_PUBLIC_SERVER_URL: z.string().url(),
            EXPO_PUBLIC_WS_URL: z.string().url(),
        },
        {
            description: "Environment variables for the Expo app",
            required_error:
                "A required environment variable is missing. Please check your .env file.",
            invalid_type_error:
                "An environment variable has an invalid type. Ensure EXPO_PUBLIC_SERVER_URL and EXPO_PUBLIC_WS_URL are strings in your .env file.",
        }
    )
    .transform((env) => ({
        SERVER_URL: env.EXPO_PUBLIC_SERVER_URL,
        WS_URL: env.EXPO_PUBLIC_WS_URL,
    }))
    .parse({
        EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL ?? extra.EXPO_PUBLIC_SERVER_URL,
        EXPO_PUBLIC_WS_URL: process.env.EXPO_PUBLIC_WS_URL ?? extra.EXPO_PUBLIC_WS_URL,
    });
