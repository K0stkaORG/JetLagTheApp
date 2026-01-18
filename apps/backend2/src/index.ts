import { startServer } from './server';
import { logger } from './lib/logger';
import { env } from '~/env';

const PORT = env.SERVER_PORT;

// Start the server
startServer(PORT)
  .then(() => {
    logger.info(`Server started successfully on port ${PORT}`);
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
