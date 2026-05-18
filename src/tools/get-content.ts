import { z } from 'zod'
import { fetchRecentPosts, projectPost } from '../lib/beehiiv-client.ts'

export const getContentSchema = z
  .object({
    limit: z.number().int().min(1).max(20).optional(),
    type: z.enum(['newsletter', 'social']).optional(),
  })
  .strict()

export const getContentDefinition = {
  name: 'get_content',
  description:
    'Returns recent Avem published content (newsletters from Beehiiv). Optionally filter by type. Default limit: 5, max: 20. Cached 5 min at edge.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 20,
        description: 'Max number of items (default 5, max 20).',
      },
      type: {
        type: 'string',
        enum: ['newsletter', 'social'],
        description: 'Filter by type. Newsletter = Beehiiv post. Social currently not yet wired.',
      },
    },
    additionalProperties: false,
  },
}

export interface GetContentEnv {
  BEEHIIV_API_KEY?: string
  BEEHIIV_PUBLICATION_ID: string
  CACHE_TTL_SECONDS?: string
}

export async function getContentHandler(args: unknown, env: GetContentEnv): Promise<unknown> {
  const parsed = getContentSchema.parse(args ?? {})
  const limit = parsed.limit ?? 5
  const type = parsed.type ?? 'newsletter'

  // Social type is a future hook; for now we only have newsletter.
  if (type === 'social') {
    return {
      type: 'social',
      items: [],
      note: 'Social-channel sync (Typefully etc.) not yet exposed via MCP. Watchlist for v2.',
    }
  }

  if (!env.BEEHIIV_API_KEY) {
    return {
      ok: false,
      error: 'beehiiv_unconfigured',
      note: 'Server has no BEEHIIV_API_KEY configured. Set it via `wrangler secret put BEEHIIV_API_KEY`.',
    }
  }

  try {
    const posts = await fetchRecentPosts(
      {
        apiKey: env.BEEHIIV_API_KEY,
        publicationId: env.BEEHIIV_PUBLICATION_ID,
        cacheTtlSeconds: env.CACHE_TTL_SECONDS ? Number(env.CACHE_TTL_SECONDS) : undefined,
      },
      limit,
    )
    return {
      type: 'newsletter',
      count: posts.length,
      items: posts.map(projectPost),
    }
  } catch (e) {
    return {
      ok: false,
      error: 'beehiiv_unavailable',
      note: `Beehiiv upstream error. Try again later.`,
      detail: e instanceof Error ? e.message : String(e),
    }
  }
}
