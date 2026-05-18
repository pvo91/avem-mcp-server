// Cloudflare Cache API wrapper for live-API responses.
// Used by Beehiiv + GitHub clients to stay under their rate limits.

const DEFAULT_TTL_SECONDS = 300 // 5 minutes

export interface CachedFetchOptions {
  /** Cache TTL in seconds. Default: 300 (5 min). */
  ttlSeconds?: number
  /** Custom cache key. Defaults to request URL. */
  cacheKey?: string
}

/**
 * Fetch a URL with Cloudflare edge caching.
 * Returns the parsed JSON body. Network failures throw.
 * Cache misses populate the cache for subsequent requests.
 */
export async function cachedFetchJson<T = unknown>(
  url: string,
  init: RequestInit = {},
  opts: CachedFetchOptions = {},
): Promise<T> {
  const ttl = opts.ttlSeconds ?? DEFAULT_TTL_SECONDS
  const cacheKey = opts.cacheKey ?? url

  // Cloudflare Cache API is region-local; works in Workers runtime.
  // For module-Workers, `caches.default` is available globally.
  const cache = (globalThis as { caches?: CacheStorage }).caches?.default
  const cacheReq = new Request(cacheKey, { method: 'GET' })

  if (cache) {
    const hit = await cache.match(cacheReq)
    if (hit) {
      return (await hit.json()) as T
    }
  }

  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`Upstream ${res.status}: ${res.statusText}`)
  }
  const body = (await res.json()) as T

  if (cache) {
    const cacheResponse = new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${ttl}`,
      },
    })
    // Fire-and-forget; cache.put() doesn't need awaiting before returning to caller.
    await cache.put(cacheReq, cacheResponse)
  }

  return body
}
