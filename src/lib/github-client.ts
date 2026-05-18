// GitHub REST API client. Public-repos can be fetched unauth (60 req/h
// shared per-IP), authed bumps to 5000 req/h. We use a personal access
// token with `public_repo` scope.

import { cachedFetchJson } from './cache.ts'

export interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  topics: string[]
  archived: boolean
  fork: boolean
  updated_at: string
  pushed_at: string
}

export interface GitHubClientConfig {
  username: string
  token?: string // optional — boosts rate limit
  cacheTtlSeconds?: number
}

export async function fetchPublicRepos(
  config: GitHubClientConfig,
  limit: number = 30,
): Promise<GitHubRepo[]> {
  const url = `https://api.github.com/users/${config.username}/repos?type=public&sort=updated&per_page=${limit}`
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'avem-mcp-server',
  }
  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`
  }
  const body = await cachedFetchJson<GitHubRepo[]>(
    url,
    { headers },
    {
      ttlSeconds: config.cacheTtlSeconds ?? 300,
      cacheKey: `github:repos:${config.username}:${limit}`,
    },
  )
  return body ?? []
}

export function projectRepo(r: GitHubRepo): Record<string, unknown> {
  return {
    name: r.name,
    description: r.description,
    url: r.html_url,
    language: r.language,
    stars: r.stargazers_count,
    topics: r.topics,
    updated_at: r.updated_at,
    archived: r.archived,
  }
}
