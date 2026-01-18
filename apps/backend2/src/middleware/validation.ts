import { NextFunction, Request, Response } from 'express';

import { AppError } from './errorHandler';
import { ZodType } from 'zod';

export const validate = (schema: ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      next(new AppError(400, error.errors?.[0]?.message || 'Validation failed'));
    }
  };
};

export const validateRequest = (schema: ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      next(new AppError(400, error.errors?.[0]?.message || 'Validation failed'));
    }
  };
};
