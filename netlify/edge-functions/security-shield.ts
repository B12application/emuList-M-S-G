// Netlify Edge Function: Security Shield (WAF & Scanner Blocker)
// Runs on Deno at the Netlify Edge CDN layer before any static file or serverless function

interface EdgeContext {
  ip?: string;
  next: () => Promise<Response>;
  geo?: {
    city?: string;
    country?: {
      code?: string;
      name?: string;
    };
  };
}

// Known malicious probes, sensitive paths, path traversal and attack patterns
const BLOCKED_PATTERNS: RegExp[] = [
  /\/\.env/i,
  /\/\.git/i,
  /\.php(\/|$|\?)/i,
  /phpinfo/i,
  /\/wp-(admin|login|content|includes|json)/i,
  /\/wordpress/i,
  /\/xmlrpc\.php/i,
  /\/tmp\//i,
  /\/temp\//i,
  /\/etc\/(passwd|shadow|hosts)/i,
  /\/proc\/self/i,
  /\/var\/log/i,
  /\/cgi-bin/i,
  /\/\.aws/i,
  /\/\.ssh/i,
  /\/debug\//i,
  /\/telescope/i,
  /\/actuator/i,
  /\/server-status/i,
  /\/web\.config/i,
  /\/composer\.(json|lock)/i,
  /\/package\.json/i,
  /\.(sql|bak|backup|swp|ini|conf|config|sh|bash|dump)$/i,
  /\.\./, // Path traversal attempt
];

// In-memory sliding rate limiter per edge instance
const ipTracker = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 100;

export default async function handler(request: Request, context: EdgeContext) {
  const url = new URL(request.url);
  const path = url.pathname;
  const search = url.search;

  // 1. Immediate detection of malicious probe URLs
  const isMalicious = BLOCKED_PATTERNS.some(
    (pattern) => pattern.test(path) || pattern.test(search)
  );

  if (isMalicious) {
    console.warn(
      `[SecurityShield] BLOCKED scanner probe: ${request.method} ${path}${search} from IP: ${context.ip || 'unknown'}`
    );
    return new Response(
      JSON.stringify({
        error: "Forbidden",
        message: "Access to this resource is blocked by security policy.",
        status: 403,
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // 2. IP Rate limiting
  const clientIp =
    context.ip ||
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";

  if (clientIp !== "unknown") {
    const now = Date.now();
    const tracker = ipTracker.get(clientIp);

    if (!tracker || now > tracker.resetTime) {
      ipTracker.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
      tracker.count++;
      if (tracker.count > MAX_REQUESTS_PER_MINUTE) {
        console.warn(
          `[SecurityShield] Rate limit triggered for IP ${clientIp} (${tracker.count} req/min)`
        );
        return new Response(
          JSON.stringify({
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please slow down.",
            status: 429,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "60",
              "X-Robots-Tag": "noindex, nofollow",
              "Cache-Control": "no-store",
            },
          }
        );
      }
    }
  }

  // Clean request: allow through to site
  return await context.next();
}
