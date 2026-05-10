import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitStore>();

export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 100,
    keyGenerator,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    let key: string;
    if (keyGenerator) {
      key = keyGenerator(req);
    } else {
      const { userId } = getAuth(req);
      key = userId || req.ip || 'unknown';
    }

    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (record && record.resetTime < now) {
      rateLimitStore.delete(key);
    }

    const currentRecord = rateLimitStore.get(key) || {
      count: 0,
      resetTime: now + windowMs,
    };

    currentRecord.count++;
    rateLimitStore.set(key, currentRecord);

    if (currentRecord.count > maxRequests) {
      const resetAfter = Math.ceil((currentRecord.resetTime - now) / 1000);
      res.set('Retry-After', resetAfter.toString());
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: resetAfter,
      });
    }

    res.set('X-RateLimit-Limit', maxRequests.toString());
    res.set('X-RateLimit-Remaining', (maxRequests - currentRecord.count).toString());
    res.set('X-RateLimit-Reset', new Date(currentRecord.resetTime).toISOString());

    next();
  };
}

export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

export function getRateLimitStore() {
  return rateLimitStore;
}
