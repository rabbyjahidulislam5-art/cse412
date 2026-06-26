import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { error } from '../utils/response';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
        return error(res, 'VALIDATION_ERROR', 'Invalid request data', 400, details);
      }
      next(err);
    }
  };
}
