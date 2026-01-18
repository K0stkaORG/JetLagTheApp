import { Application } from 'express';
import { exampleRouter } from './example.routes';
import { authRouter } from './auth.routes';

export function setupRoutes(app: Application): void {
  // API routes
  app.use('/api/example', exampleRouter);
  app.use('/api/auth', authRouter);

  // 404 handler
  app.use('*', (_req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
    });
  });
}
