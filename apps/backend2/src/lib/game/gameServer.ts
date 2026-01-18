import { Server, Socket } from 'socket.io';
import { logger } from '../logger';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@jetlag/shared-types';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class GameServer {
  public readonly roomId: string;

  constructor(
    private readonly io: AppServer,
    public readonly gameId: string
  ) {
    this.roomId = `game:${gameId}`;
    logger.info(`GameServer initialized for game ${gameId} in room ${this.roomId}`);
  }

  public joinPlayer(socket: AppSocket) {
    logger.info(`Player ${socket.id} joining game ${this.gameId}`);
    socket.join(this.roomId);

    // Notify room
    this.io.to(this.roomId).emit('player-joined', { socketId: socket.id });

    // Send current game state or welcome message
    socket.emit('game-joined', { gameId: this.gameId });
  }

  public leavePlayer(socket: AppSocket) {
    logger.info(`Player ${socket.id} leaving game ${this.gameId}`);
    socket.leave(this.roomId);

    // Notify room
    this.io.to(this.roomId).emit('player-left', { socketId: socket.id });
  }

  public shutdown() {
    logger.info(`Shutting down GameServer for game ${this.gameId}`);
    // Cleanup logic here
    this.io.socketsLeave(this.roomId);
  }
}
