// src/backend/services/redisService.ts
// Universal Redis Service for B12 (by EMU)
// Works seamlessly in Cloudflare Pages via /api/redis-cache, with direct dev support and fallback.

export interface RedisUsageResult {
  date: string;
  omdb: number;
  tmdb: number;
  cacheHits: number;
}

export interface RedisStatusResult {
  configured: boolean;
  connected: boolean;
  dbSize: number;
}

// In-memory circuit breaker to avoid spamming if Redis is unconfigured
let isRedisConfigured = true;
let lastCheckTime = 0;

/**
 * Checks Redis connectivity and status
 */
export async function checkRedisStatus(): Promise<RedisStatusResult> {
  try {
    const res = await fetch('/api/redis-cache?action=status', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      return { configured: false, connected: false, dbSize: 0 };
    }
    const json = await res.json();
    isRedisConfigured = Boolean(json.configured);
    return {
      configured: Boolean(json.configured),
      connected: Boolean(json.success && json.status === 'PONG'),
      dbSize: json.dbSize || 0,
    };
  } catch {
    return { configured: false, connected: false, dbSize: 0 };
  }
}

/**
 * Fetches cached item from Redis Edge
 */
export async function getRedisCache<T>(key: string): Promise<{ hit: boolean; data: T | null }> {
  // If we recently learned that Redis is not configured, skip to save HTTP calls
  if (!isRedisConfigured && Date.now() - lastCheckTime < 60000) {
    return { hit: false, data: null };
  }

  try {
    const encodedKey = encodeURIComponent(key);
    const res = await fetch(`/api/redis-cache?key=${encodedKey}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return { hit: false, data: null };
    }

    const json = await res.json();
    if (json.configured === false) {
      isRedisConfigured = false;
      lastCheckTime = Date.now();
      return { hit: false, data: null };
    }

    if (json.success && json.hit && json.data) {
      return { hit: true, data: json.data as T };
    }

    return { hit: false, data: null };
  } catch {
    return { hit: false, data: null };
  }
}

/**
 * Saves item to Redis with TTL
 * @param ttlSeconds default 14 days (1,209,600s)
 */
export async function setRedisCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = 14 * 24 * 60 * 60
): Promise<boolean> {
  if (!isRedisConfigured && Date.now() - lastCheckTime < 60000) {
    return false;
  }

  try {
    const res = await fetch('/api/redis-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set',
        key,
        data,
        ttlSeconds,
      }),
    });

    if (!res.ok) return false;
    const json = await res.json();
    if (json.configured === false) {
      isRedisConfigured = false;
      lastCheckTime = Date.now();
      return false;
    }
    return Boolean(json.success);
  } catch {
    return false;
  }
}

/**
 * Atomically increments the daily quota counter in Redis for all users
 */
export async function incrRedisQuota(api: 'omdb' | 'tmdb', date?: string): Promise<number | null> {
  try {
    const res = await fetch('/api/redis-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'incrQuota',
        api,
        date: date || new Date().toISOString().split('T')[0],
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && typeof json.count === 'number') {
      return json.count;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Atomically increments cache hit counter in Redis
 */
export async function incrRedisHit(date?: string): Promise<number | null> {
  try {
    const res = await fetch('/api/redis-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'incrHit',
        date: date || new Date().toISOString().split('T')[0],
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && typeof json.count === 'number') {
      return json.count;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches shared daily usage from Redis across all users
 */
export async function getRedisDailyUsage(date?: string): Promise<RedisUsageResult | null> {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const res = await fetch(`/api/redis-cache?action=getUsage&date=${targetDate}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.usage) {
      return json.usage as RedisUsageResult;
    }
    return null;
  } catch {
    return null;
  }
}
