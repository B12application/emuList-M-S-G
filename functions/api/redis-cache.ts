// functions/api/redis-cache.ts
// Cloudflare Pages Function: Serverless Edge Redis Caching & Global Quota Management
// Powered by Upstash Redis REST API (100% Serverless, Free Tier: 10,000 req/day, 256MB)
// Zero-Exposure Policy: Keeps Redis tokens strictly server-side.

interface Env {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Helper to execute an Upstash Redis REST command
 */
async function runUpstashCommand(
  url: string,
  token: string,
  commandParts: (string | number)[]
): Promise<any> {
  const cleanUrl = url.replace(/\/+$/, '');
  
  // Upstash REST API accepts POST with JSON array of command tokens
  const response = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commandParts),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upstash HTTP ${response.status}: ${errorText}`);
  }

  const json: any = await response.json();
  if (json.error) {
    throw new Error(`Upstash Redis error: ${json.error}`);
  }

  return json.result;
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  const redisUrl = env.UPSTASH_REDIS_REST_URL;
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

  // Check if Redis is configured on Cloudflare
  if (!redisUrl || !redisToken) {
    return new Response(
      JSON.stringify({
        success: false,
        configured: false,
        error: 'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not configured.',
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  }

  try {
    // ── 1. GET Request: Read cache by key ──────────────────────────────────────
    if (request.method === 'GET') {
      const key = url.searchParams.get('key');
      const action = url.searchParams.get('action');

      // Health / Status Check
      if (action === 'ping' || action === 'status') {
        const pingResult = await runUpstashCommand(redisUrl, redisToken, ['PING']);
        const dbSize = await runUpstashCommand(redisUrl, redisToken, ['DBSIZE']);
        return new Response(
          JSON.stringify({
            success: true,
            configured: true,
            status: pingResult,
            dbSize: typeof dbSize === 'number' ? dbSize : 0,
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // Read Daily Global Usage
      if (action === 'getUsage') {
        const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
        const omdbKey = `b12:quota:omdb:${date}`;
        const tmdbKey = `b12:quota:tmdb:${date}`;
        const hitsKey = `b12:quota:hits:${date}`;

        const omdbRaw = await runUpstashCommand(redisUrl, redisToken, ['GET', omdbKey]);
        const tmdbRaw = await runUpstashCommand(redisUrl, redisToken, ['GET', tmdbKey]);
        const hitsRaw = await runUpstashCommand(redisUrl, redisToken, ['GET', hitsKey]);

        return new Response(
          JSON.stringify({
            success: true,
            configured: true,
            usage: {
              date,
              omdb: omdbRaw ? parseInt(omdbRaw, 10) : 0,
              tmdb: tmdbRaw ? parseInt(tmdbRaw, 10) : 0,
              cacheHits: hitsRaw ? parseInt(hitsRaw, 10) : 0,
            },
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      if (!key) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing ?key= parameter' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      // Fetch cache item
      const rawValue = await runUpstashCommand(redisUrl, redisToken, ['GET', key]);
      if (!rawValue) {
        return new Response(
          JSON.stringify({ success: true, hit: false, data: null }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      let parsedData: any = rawValue;
      try {
        parsedData = JSON.parse(rawValue);
      } catch {
        // String value
      }

      return new Response(
        JSON.stringify({ success: true, hit: true, data: parsedData }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // ── 2. POST Request: Set cache, atomic increment, or delete ─────────────────
    if (request.method === 'POST') {
      const body = await request.json() as any;
      const { action, key, data, ttlSeconds } = body;

      // Atomic increment for daily quota tracking across all users
      if (action === 'incrQuota') {
        const { api, date } = body;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const quotaKey = `b12:quota:${api}:${targetDate}`;

        // Atomic INCR in Redis (thread-safe, shared across all users)
        const newCount = await runUpstashCommand(redisUrl, redisToken, ['INCR', quotaKey]);
        
        // Set 30 days expiration on quota key so old dates auto-expire
        await runUpstashCommand(redisUrl, redisToken, ['EXPIRE', quotaKey, 30 * 24 * 60 * 60]);

        return new Response(
          JSON.stringify({ success: true, key: quotaKey, count: newCount }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // Atomic increment for cache hits
      if (action === 'incrHit') {
        const targetDate = body.date || new Date().toISOString().split('T')[0];
        const hitKey = `b12:quota:hits:${targetDate}`;
        const newHits = await runUpstashCommand(redisUrl, redisToken, ['INCR', hitKey]);
        await runUpstashCommand(redisUrl, redisToken, ['EXPIRE', hitKey, 30 * 24 * 60 * 60]);

        return new Response(
          JSON.stringify({ success: true, count: newHits }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // Set Cache with TTL
      if (action === 'set') {
        if (!key) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing key' }),
            { status: 400, headers: CORS_HEADERS }
          );
        }

        const serialized = typeof data === 'string' ? data : JSON.stringify(data);
        const ttl = ttlSeconds && Number.isInteger(ttlSeconds) && ttlSeconds > 0
          ? ttlSeconds
          : 14 * 24 * 60 * 60; // Default 14 days

        await runUpstashCommand(redisUrl, redisToken, ['SET', key, serialized, 'EX', ttl]);

        return new Response(
          JSON.stringify({ success: true, key, ttl }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // Delete a key or prefix
      if (action === 'del') {
        if (!key) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing key' }),
            { status: 400, headers: CORS_HEADERS }
          );
        }

        await runUpstashCommand(redisUrl, redisToken, ['DEL', key]);
        return new Response(
          JSON.stringify({ success: true, deleted: key }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: `Unsupported action: ${action}` }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('Redis Edge Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Redis Edge execution error' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
