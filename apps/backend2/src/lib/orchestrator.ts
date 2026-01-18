import { Server, Socket } from 'socket.io';
import { GameServer } from './game/gameServer';
import { logger } from './logger';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@jetlag/shared-types';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class Orchestrator {
  private static instance: Orchestrator;
  private gameServers: Map<string, GameServer> = new Map();

  private constructor(private readonly io: AppServer) {
    logger.info('Orchestrator initialized');
  }

  public static getInstance(io?: AppServer): Orchestrator {
    if (!Orchestrator.instance) {
      if (!io) {
        throw new Error('Orchestrator must be initialized with an IO server instance first');
      }
      Orchestrator.instance = new Orchestrator(io);
    }
    return Orchestrator.instance;
  }

  public async loadState() {
    logger.info('Loading server state from DB...');
    // TODO: Implement loading logic
    // const activeGames = await db.select().from(games).where(eq(games.isActive, true));
    // for (const game of activeGames) {
    //   this.createGameServer(game.id);
    // }
  }

  public async saveState() {
    logger.info('Saving server state to DB...');
    // TODO: Implement saving logic
  }

  public createGameServer(gameId: string): GameServer {
    if (this.gameServers.has(gameId)) {
      logger.warn(`GameServer for game ${gameId} already exists`);
      return this.gameServers.get(gameId)!;
    }

    const gameServer = new GameServer(this.io, gameId);
    this.gameServers.set(gameId, gameServer);

    // Persist functionality - every change written to DB
    this.saveState();

    return gameServer;
  }

  public getGameServer(gameId: string): GameServer | undefined {
    return this.gameServers.get(gameId);
  }

  public removeGameServer(gameId: string) {
    const server = this.gameServers.get(gameId);
    if (server) {
      server.shutdown();
      this.gameServers.delete(gameId);

      // Persist functionality - every change written to DB
      this.saveState();
    }
  }

  public handleJoinGame(socket: AppSocket, gameId: string) {
    let server = this.getGameServer(gameId);
    if (!server) {
      logger.info(`Game ${gameId} not found, creating new GameServer instance.`);
      server = this.createGameServer(gameId);
    }
    server.joinPlayer(socket);
  }
}
