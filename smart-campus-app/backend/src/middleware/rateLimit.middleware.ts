import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

let redis: Redis | null = null;
try {
  if (process.env.REDIS_HOST) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });
  }
} catch {}

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new (RedisStore as any)({ sendCommand: (...args: any[]) => redis!.call(...args), prefix: 'rl:global:' }) : undefined,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many auth attempts' } },
  standardHeaders: true,
  store: redis ? new (RedisStore as any)({ sendCommand: (...args: any[]) => redis!.call(...args), prefix: 'rl:auth:' }) : undefined,
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many OTP attempts' } },
  standardHeaders: true,
  store: redis ? new (RedisStore as any)({ sendCommand: (...args: any[]) => redis!.call(...args), prefix: 'rl:otp:' }) : undefined,
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many payment requests' } },
  standardHeaders: true,
  store: redis ? new (RedisStore as any)({ sendCommand: (...args: any[]) => redis!.call(...args), prefix: 'rl:pay:' }) : undefined,
});
