// import "dotenv/config";

// import { z } from "zod";

// export const env = z
//     .object({
//         SERVER_URL: z.string().readonly(),
//         WS_URL: z.string().readonly(),
//     })
//     .parse(process.env);

export const env = {
    SERVER_URL: process.env.SERVER_URL || "http://localhost:5000",
    WS_URL: process.env.WS_URL || "ws://localhost:5555",
} as const;
