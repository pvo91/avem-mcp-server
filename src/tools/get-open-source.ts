import { z } from 'zod'
import { fetchPublicRepos, projectRepo } from '../lib/github-client.ts'

export const getOpenSourceSchema = z
  .object({
    category: z.string().optional(),
  })
  .strict()

export const getOpenSourceDefinition = {
  name: 'get_open_source',
  description:
    'Returns Avem founder public GitHub repos. Optionally filter by category (matched against repo topics). Excludes archived and fork repos by default. Cached 5 min at edge.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Optional topic-match filter (case-insensitive substring of any topic tag).',
      },
    },
    additionalProperties: false,
  },
}

export interface GetOpenSourceEnv {
  GITHUB_TOKEN?: string
  GITHUB_USERNAME: string
  CACHE_TTL_SECONDS?: string
}

export async function getOpenSourceHandler(args: unknown, env: GetOpenSourceEnv): Promise<unknown> {
  const parsed = getOpenSourceSchema.parse(args ?? {})

  try {
    const repos = await fetchPublicRepos(
      {
        username: env.GITHUB_USERNAME,
        token: env.GITHUB_TOKEN,
        cacheTtlSeconds: env.CACHE_TTL_SECONDS ? Number(env.CACHE_TTL_SECONDS) : undefined,
      },
      30,
    )
    let filtered = repos.filter((r) => !r.archived && !r.fork)
    if (parsed.category) {
      const needle = parsed.category.toLowerCase()
      filtered = filtered.filter((r) =>
        r.topics.some((t) => t.toLowerCase().includes(needle)),
      )
    }
    return {
      username: env.GITHUB_USERNAME,
      count: filtered.length,
      items: filtered.map(projectRepo),
    }
  } catch (e) {
    return {
      ok: false,
      error: 'github_unavailable',
      note: 'GitHub upstream error or rate-limit reached.',
      detail: e instanceof Error ? e.message : String(e),
    }
  }
}
