// Cloudflare Cache API wrapper for live-API responses.
// Used by Beehiiv + GitHub clients to stay under their rate limits.
//
// Design principle: the cache is an OPTIMIZATION, never a hard requirement.
// Any cache operation that throws (invalid URL, runtime quirk, put rejection)
// must NOT fail the underlying fetch — we fall through to a direct request.

const DEFAULT_TTL_SECONDS = 300 // 5 minutes

export interface CachedFetchOptions {
  /** Cache TTL in seconds. Default: 300 (5 min). */
  ttlSeconds?: number
  /** Custom logical cache key (e.g. "beehiiv:posts:5"). Wrapped into a valid URL. */
  cacheKey?: string
}

/**
 * Build a fully-qualified, valid cache URL from a logical key.
 * Cloudflare Cache API rejects bare strings like "beehiiv:posts:5" with
 * "Invalid URL. Cache API keys must be fully-qualified, valid URLs."
 */
function toCacheUrl(logicalKey: string | undefined, fallbackUrl: string): string {
  if (!logicalKey) return fallbackUrl
  return `https://avem-mcp-cache.dev/${encodeURIComponent(logicalKey)}`
}

/**
 * Fetch a URL with best-effort Cloudflare edge caching.
 * Returns the parsed JSON body. Network failures on the REAL fetch throw;
 * cache failures are swallowed (logged-implicit) and bypassed.
 */
export async function cachedFetchJson<T = unknown>(
  url: string,
  init: RequestInit = {},
  opts: CachedFetchOptions = {},
): Promise<T> {
  const ttl = opts.ttlSeconds ?? DEFAULT_TTL_SECONDS
  const cache = (globalThis as { caches?: CacheStorage }).caches?.default

  // Build cache request defensively — never let key construction throw.
  let cacheReq: Request | null = null
  if (cache) {
    try {
      cacheReq = new Request(toCacheUrl(opts.cacheKey, url), { method: 'GET' })
    } catch {
      cacheReq = null // bad key → skip caching entirely
    }
  }

  // Cache read (best-effort).
  if (cache && cacheReq) {
    try {
      const hit = await cache.match(cacheReq)
      if (hit) return (await hit.json()) as T
    } catch {
      /* cache miss path — fall through to live fetch */
    }
  }

  // Real fetch — failures here DO throw (caller handles graceful degradation).
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`Upstream ${res.status}: ${res.statusText}`)
  }
  const body = (await res.json()) as T

  // Cache write (best-effort, never throws to caller).
  if (cache && cacheReq) {
    try {
      const cacheResponse = new Response(JSON.stringify(body), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${ttl}`,
        },
      })
      await cache.put(cacheReq, cacheResponse)
    } catch {
      /* cache write failed — response already obtained, ignore */
    }
  }

  return body
}
