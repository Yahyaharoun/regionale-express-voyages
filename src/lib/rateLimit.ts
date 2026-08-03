/**
 * Edge-compatible Rate Limiter with Upstash Redis (primary) and in-memory fallback.
 *
 * In serverless environments (Vercel), each function invocation is isolated — a Map()
 * in memory is NOT shared across invocations and therefore useless for rate limiting.
 *
 * Primary strategy: Upstash Redis (persistent, shared across all instances).
 * Fallback: in-memory Map (for local dev or if Redis is not configured).
 *
 * To enable Redis: add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to your env.
 */

const RATE_LIMIT_MAX = 5;       // Maximum requests per window
const RATE_LIMIT_WINDOW = 60;   // Window in seconds

// In-memory fallback (dev only / single-instance)
const memoryCache = new Map<string, { count: number; resetTime: number }>();

async function checkWithRedis(id: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null as unknown as boolean; // Signal: Redis not configured

  try {
    const key = `rate_limit:${id}`;
    // INCR increments atomically and returns the new value
    const incrRes = await fetch(`${url}/incr/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const { result: count } = await incrRes.json() as { result: number };

    // On first request, set expiry
    if (count === 1) {
      await fetch(`${url}/expire/${key}/${RATE_LIMIT_WINDOW}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    return count <= RATE_LIMIT_MAX;
  } catch {
    // Redis error: fail open (allow the request, log the error)
    console.error('[RateLimit] Redis check failed, allowing request.');
    return true;
  }
}

function checkWithMemory(id: string): boolean {
  const now = Date.now();
  const record = memoryCache.get(id);

  if (!record || record.resetTime < now) {
    memoryCache.set(id, { count: 1, resetTime: now + RATE_LIMIT_WINDOW * 1000 });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) return false;

  record.count += 1;
  return true;
}

export const actionRateLimit = {
  async check(id: string): Promise<boolean> {
    const redisResult = await checkWithRedis(id);
    // If Redis is configured, use its result
    if (redisResult !== (null as unknown as boolean)) return redisResult;
    // Otherwise fall back to in-memory (dev / single-instance only)
    return checkWithMemory(id);
  }
};
