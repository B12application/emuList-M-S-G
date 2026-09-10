// netlify/functions/utils/rateLimiter.ts
// In-memory IP rate limiter for Netlify Serverless Functions

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const clientLimitMap = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(
  ip: string,
  options: RateLimitOptions = { windowMs: 60 * 1000, maxRequests: 20 }
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = clientLimitMap.get(ip);

  // Periodic cleanup to avoid memory leak in long-lived warm containers
  if (clientLimitMap.size > 1000) {
    for (const [key, val] of clientLimitMap.entries()) {
      if (now > val.resetTime) {
        clientLimitMap.delete(key);
      }
    }
  }

  if (!record || now > record.resetTime) {
    clientLimitMap.set(ip, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  record.count++;

  if (record.count > options.maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: retryAfter,
    };
  }

  return {
    allowed: true,
    remaining: options.maxRequests - record.count,
    retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}

export function getClientIp(headers: Record<string, string | undefined>): string {
  return (
    headers['x-nf-client-connection-ip'] ||
    headers['client-ip'] ||
    headers['cf-connecting-ip'] ||
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'anonymous'
  );
}
