import { env } from "~/lib/env";
import { io } from "socket.io-client";

export const socket = io(env.WS_URL, {
    path: "/",
    autoConnect: false,
    reconnection: false,
});
