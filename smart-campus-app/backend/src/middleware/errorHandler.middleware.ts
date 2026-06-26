import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';
import prisma from '../config/prisma';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error(`[ERROR] ${err.message}`, err.stack);

  // Prisma unique constraint
  if (err.message.includes('Unique constraint')) {
    return error(res, 'DUPLICATE', 'A record with this value already exists', 409);
  }

  // Prisma not found
  if (err.message.includes('Record to update not found') || err.message.includes('No User found')) {
    return error(res, 'NOT_FOUND', 'Resource not found', 404);
  }

  return error(res, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
}

export function notFound(req: Request, res: Response) {
  error(res, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404);
}

export async function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', async () => {
    const duration = Date.now() - start;
    const userId = (req as any).user?.id;
    if (userId && req.method !== 'GET') {
      try {
        await prisma.auditLog.create({
          data: {
            userId,
            action: `${req.method} ${req.route?.path || req.originalUrl}`,
            entityType: 'API',
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
          },
        });
      } catch {}
    }
  });
  next();
}
