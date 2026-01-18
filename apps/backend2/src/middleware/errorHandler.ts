import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error('Operational error:', {
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
    });

    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Programming or unknown errors
  logger.error('Unexpected error:', {
    error: err,
    stack: err.stack,
    path: req.path,
  });

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
