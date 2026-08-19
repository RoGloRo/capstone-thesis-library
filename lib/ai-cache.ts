import redis from "@/database/redis";

// ─────────────────────────────────────────────────────────────────────────────
// Reusable, best-effort Redis cache helpers for AI results (trending + recs).
//
// All operations are wrapped in try/catch and NEVER throw into the application.
// On any Redis failure the getters behave like a cache MISS (return null/[]),
// and the setters/deleters fail silently (return false). Callers should fall
// back to their normal (AI) generation path on a miss, exactly as if the cache
// did not exist.
//
// Reuses the existing client in `database/redis.ts` — no second client created.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shape stored in the cache: the AI-ordered book IDs plus when they were
 * generated. Callers re-query fresh Book records from Neon using these IDs.
 */
export interface AiCacheValue {
  ids: string[];
  generatedAt: string;
}

/**
 * Reads and parses a JSON value under `key`.
 * Returns the parsed value, or `null` on a miss or on any Redis failure.
 */
export async function getCacheJson<T = AiCacheValue>(
  key: string
): Promise<T | null> {
  try {
    return (await redis.get<T>(key)) ?? null;
  } catch (error) {
    console.warn("[ai-cache] get failed (treated as miss):", error);
    return null;
  }
}

/**
 * Stores `value` as JSON under `key` with the given TTL in seconds.
 * Returns `true` on success, `false` on any Redis failure.
 */
export async function setCacheJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  try {
    if (ttlSeconds <= 0) {
      await redis.set(key, value);
    } else {
      await redis.set(key, value, { ex: ttlSeconds });
    }
    return true;
  } catch (error) {
    console.warn("[ai-cache] set failed (ignored):", error);
    return false;
  }
}

/**
 * Deletes a single cache key. Returns `true` if the key was deleted, `false`
 * if it did not exist or on any Redis failure.
 */
export async function deleteCacheKey(key: string): Promise<boolean> {
  try {
    const deleted = await redis.del(key);
    return deleted > 0;
  } catch (error) {
    console.warn("[ai-cache] delete failed (ignored):", error);
    return false;
  }
}

/**
 * Deletes every key matching `pattern` (e.g. "ai:trending:*") using SCAN +
 * DEL so it does not block Redis. Returns the number of keys deleted, or 0 on
 * any Redis failure.
 */
export async function deleteCachesByPattern(pattern: string): Promise<number> {
  const keysToDelete: string[] = [];
  const SCAN_COUNT = 100;

  try {
    let cursor = 0;

    do {
      // @upstash/redis SCAN returns a [cursor, keys] tuple.
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: SCAN_COUNT,
      });

      if (keys.length > 0) {
        keysToDelete.push(...keys);
        await redis.del(...keys);
      }

      cursor = Number(nextCursor);
    } while (Number(cursor) !== 0);

    return keysToDelete.length;
  } catch (error) {
    console.warn("[ai-cache] pattern delete failed (ignored):", error);
    return 0;
  }
}
