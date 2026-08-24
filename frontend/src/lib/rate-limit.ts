interface RateLimitEntry {
  blockedUntil: number;
  count: number;
  windowStartedAt: number;
}

export interface RateLimitOptions {
  blockMs?: number;
  key: string;
  limit: number;
  now?: number;
  windowMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

const globalRateLimit = globalThis as typeof globalThis & {
  jobHunterRateLimits?: Map<string, RateLimitEntry>;
  jobHunterRateLimitLastCleanup?: number;
};

const buckets = globalRateLimit.jobHunterRateLimits ?? new Map<string, RateLimitEntry>();
globalRateLimit.jobHunterRateLimits = buckets;

function cleanup(now: number): void {
  const lastCleanup = globalRateLimit.jobHunterRateLimitLastCleanup ?? 0;
  if (now - lastCleanup < 60_000 && buckets.size < 10_000) return;
  for (const [key, entry] of buckets) {
    if (entry.blockedUntil <= now && now - entry.windowStartedAt > 86_400_000) buckets.delete(key);
  }
  globalRateLimit.jobHunterRateLimitLastCleanup = now;
}

export function consumeRateLimit(options: RateLimitOptions): RateLimitDecision {
  const now = options.now ?? Date.now();
  cleanup(now);
  const limit = Math.max(1, Math.floor(options.limit));
  const windowMs = Math.max(1_000, options.windowMs);
  const blockMs = Math.max(windowMs, options.blockMs ?? windowMs);
  const current = buckets.get(options.key);

  if (current?.blockedUntil && current.blockedUntil > now) {
    return { allowed: false, limit, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((current.blockedUntil - now) / 1_000)) };
  }

  const entry = !current || now - current.windowStartedAt >= windowMs
    ? { count: 0, windowStartedAt: now, blockedUntil: 0 }
    : current;
  entry.count += 1;

  if (entry.count > limit) {
    entry.blockedUntil = now + blockMs;
    buckets.set(options.key, entry);
    return { allowed: false, limit, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(blockMs / 1_000)) };
  }

  buckets.set(options.key, entry);
  return { allowed: true, limit, remaining: Math.max(0, limit - entry.count), retryAfterSeconds: Math.max(1, Math.ceil((entry.windowStartedAt + windowMs - now) / 1_000)) };
}

export function clientIdentifier(
  request: Request,
  trustProxy = process.env.TRUST_PROXY === "true",
): string {
  if (!trustProxy) {
    return "direct-client";
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.slice(0, 128);
  return "local-or-unknown";
}

export function positiveInteger(value: string | undefined, fallback: number, maximum = 10_000): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : fallback;
}

export function rateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  return {
    "Cache-Control": "no-store",
    "Retry-After": String(decision.retryAfterSeconds),
    "X-RateLimit-Limit": String(decision.limit),
    "X-RateLimit-Remaining": String(decision.remaining),
  };
}
