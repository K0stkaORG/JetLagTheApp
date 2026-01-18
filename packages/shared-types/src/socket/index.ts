// Data that comes FROM the client TO the server
export interface ClientToServerEvents {
	"join-game": (gameId: string) => void;
	message: (data: any) => void;
}

// Data that goes FROM the server TO the client
export interface ServerToClientEvents {
	"player-joined": (data: { socketId: string }) => void;
	"player-left": (data: { socketId: string }) => void;
	"game-joined": (data: { gameId: string }) => void;
	error: (data: { message: string }) => void;
	message: (data: any) => void;
}

// Inter-server events (if needed)
export interface InterServerEvents {
	ping: () => void;
}

// Socket data (data stored on the socket instance)
export interface SocketData {
	userId?: string;
	gameId?: string;
}
