// Cloudflare Pages Middleware: Security Shield (WAF & Scanner Blocker)
// Intercepts all incoming requests on Cloudflare Pages before static assets or API functions

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

export async function onRequest(context: any) {
  const request = context.request;
  const url = new URL(request.url);
  const path = url.pathname;
  const search = url.search;

  // 1. Immediate detection of malicious probe URLs
  const isMalicious = BLOCKED_PATTERNS.some(
    (pattern) => pattern.test(path) || pattern.test(search)
  );

  if (isMalicious) {
    const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
    console.warn(
      `[CF SecurityShield] Blocked scanner probe: ${request.method} ${path}${search} from IP: ${clientIp}`
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

  // Pass through to next handler / static page
  return await context.next();
}
