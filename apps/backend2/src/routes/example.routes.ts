import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { db } from '../db';
import { sql } from 'drizzle-orm';

export const exampleRouter: Router = Router();

// GET /api/example
exampleRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    res.json({
      status: 'success',
      data: {
        message: 'Example endpoint',
        currentTime: result.rows[0].current_time,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/example - with validation
const createExampleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    value: z.number().optional(),
  }),
});

exampleRouter.post(
  '/',
  validateRequest(createExampleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, value } = req.body;

      // Example database operation (you'll need to create the table)
      // const result = await db.query(
      //   'INSERT INTO examples (name, value) VALUES ($1, $2) RETURNING *',
      //   [name, value]
      // );

      res.status(201).json({
        status: 'success',
        data: {
          name,
          value,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
