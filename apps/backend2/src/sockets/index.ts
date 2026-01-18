import { Socket, Server as SocketIOServer } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@jetlag/shared-types';

import { Orchestrator } from '../lib/orchestrator';
import { logger } from '../lib/logger';

// Singleton instance if needed elsewhere, but for now manageable here
let orchestrator: Orchestrator;

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function setupSocketHandlers(io: AppServer): void {
  orchestrator = Orchestrator.getInstance(io);
  // We don't await this here, but we should ensure it's loaded before accepting connections that rely on state?
  // Ideally, loadState should be called during server startup sequence.

  io.on('connection', (socket: AppSocket) => {
    logger.info('Client connected', { socketId: socket.id });

    // Join a game
    socket.on('join-game', (gameId: string) => {
      if (!gameId) {
        socket.emit('error', { message: 'gameId is required' });
        return;
      }

      logger.info('Client requesting to join game', { socketId: socket.id, gameId });
      try {
        orchestrator.handleJoinGame(socket, gameId);
      } catch (err) {
        logger.error('Error joining game', { error: err });
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
      // TODO: Notify orchestrator/game server of disconnect if necessary
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error', { socketId: socket.id, error });
    });
  });

  // Middleware for authentication
  io.use((_socket, next) => {
    // Basic auth stub
    // const token = socket.handshake.auth.token;
    // if (!token) return next(new Error('Authentication required'));
    next();
  });
}
