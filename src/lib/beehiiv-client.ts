// Beehiiv REST API V2 client (server-side, Bearer token auth).
// Doc: https://developers.beehiiv.com/

import { cachedFetchJson } from './cache.ts'

export interface BeehiivPost {
  id: string
  title: string
  subtitle?: string
  status: string
  publish_date?: number
  displayed_date?: number
  thumbnail_url?: string
  web_url?: string
  audience?: string
  platform?: string
  content_tags?: string[]
}

interface BeehiivListResponse {
  data: BeehiivPost[]
  total_results?: number
}

export interface BeehiivClientConfig {
  apiKey: string
  publicationId: string
  cacheTtlSeconds?: number
}

export async function fetchRecentPosts(
  config: BeehiivClientConfig,
  limit: number = 5,
): Promise<BeehiivPost[]> {
  const url = `https://api.beehiiv.com/v2/publications/${config.publicationId}/posts?status=published&order_by=publish_date&direction=desc&limit=${limit}`
  const body = await cachedFetchJson<BeehiivListResponse>(
    url,
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/json',
      },
    },
    {
      ttlSeconds: config.cacheTtlSeconds ?? 300,
      cacheKey: `beehiiv:posts:${limit}`,
    },
  )
  return body.data ?? []
}

/** Minimal projection for the MCP tool response — strip internal fields. */
export function projectPost(p: BeehiivPost): Record<string, unknown> {
  return {
    id: p.id,
    title: p.title,
    subtitle: p.subtitle ?? null,
    publish_date: p.publish_date ?? p.displayed_date ?? null,
    web_url: p.web_url ?? null,
    content_tags: p.content_tags ?? [],
  }
}
