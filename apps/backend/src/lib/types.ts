import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@jetlag/shared-types";
import { Server, Socket } from "socket.io";

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
