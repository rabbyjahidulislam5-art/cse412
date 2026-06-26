import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/prisma';
import { error } from '../utils/response';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; sessionId: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'UNAUTHORIZED', 'Access token required', 401);
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwt.accessTokenSecret) as { sub: string; role: string; sessionId: string; iat: number; exp: number };
    req.user = { id: decoded.sub, role: decoded.role, sessionId: decoded.sessionId };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return error(res, 'TOKEN_EXPIRED', 'Access token expired', 401);
    }
    return error(res, 'INVALID_TOKEN', 'Invalid access token', 401);
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return error(res, 'UNAUTHORIZED', 'Authentication required', 401);
    if (!roles.includes(req.user.role)) {
      return error(res, 'FORBIDDEN', `Role '${req.user.role}' not permitted`, 403);
    }
    next();
  };
}

export function requirePartialAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'UNAUTHORIZED', 'Partial token required', 401);
  }
  try {
    const decoded = jwt.verify(authHeader.substring(7), config.jwt.accessTokenSecret) as any;
    req.user = { id: decoded.sub, role: decoded.role, sessionId: decoded.sessionId };
    next();
  } catch {
    return error(res, 'INVALID_TOKEN', 'Invalid token', 401);
  }
}

export async function refreshAccessToken(req: Request, res: Response, next: NextFunction) {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    return error(res, 'UNAUTHORIZED', 'Refresh token required', 401);
  }
  const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');

  const session = await prisma.session.findFirst({
    where: { refreshTokenHash: tokenHash, revokedAt: null },
    include: { user: true },
  });

  if (!session) {
    return error(res, 'INVALID_TOKEN', 'Invalid refresh token', 401);
  }

  const newAccessToken = jwt.sign(
    { sub: session.userId, role: session.user.role, sessionId: session.id },
    config.jwt.accessTokenSecret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );

  const newRefreshToken = require('crypto').randomBytes(32).toString('hex');
  const newRefreshHash = require('crypto').createHash('sha256').update(newRefreshToken).digest('hex');

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: newRefreshHash, lastUsedAt: new Date() },
  });

  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  (res as any).accessToken = newAccessToken;
  next();
}

export async function createSession(userId: string, deviceInfo: string, ipAddress: string) {
  const refreshToken = require('crypto').randomBytes(32).toString('hex');
  const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');

  const session = await prisma.session.create({
    data: { userId, refreshTokenHash: tokenHash, deviceInfo, ipAddress },
  });

  const accessToken = jwt.sign(
    { sub: userId, role: (await prisma.user.findUnique({ where: { id: userId } }))!.role, sessionId: session.id },
    config.jwt.accessTokenSecret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );

  return { accessToken, refreshToken, session };
}

export async function revokeAllSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
