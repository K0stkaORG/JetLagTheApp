import { z } from "zod";

export const env = z
    .object({
        EXPO_PUBLIC_SERVER_URL: z.string().readonly(),
        EXPO_PUBLIC_WS_URL: z.string().readonly(),
    })
    .transform((env) => ({
        SERVER_URL: env.EXPO_PUBLIC_SERVER_URL,
        WS_URL: env.EXPO_PUBLIC_WS_URL,
    }))
    .parse(process.env);
