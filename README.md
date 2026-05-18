# avem-mcp-server

> Avem Investment GmbH — MCP-Server für **mcp.avemhq.com**. Walk-the-Talk-Surface für die "Systems over headcount"-Brand.

**Status:** v0.1.0 (Sprint 1 / Avem-Bundle, 2026-05-18).

## Was das ist

Ein [Model Context Protocol](https://modelcontextprotocol.io/) Server, der die Avem-Brand und Services Agent-zugänglich macht. Jeder MCP-Client (Claude Desktop, Cursor, Cline, Continue, etc.) kann den Server anbinden und über die exposed Tools mit der Avem-Brand interagieren.

**Greg-Isenberg-Insight (2026-05-18, Auslöser):** "Imagine billions of new customers showing up with money to spend but they only shop via MCP. No MCP server means you're invisible to the fastest growing buyer on the internet." 2026-Q2 ist Distribution-Realität noch begrenzt, aber Brand-Asset + Walk-the-Talk-Signal ist heute schon valide.

## Tools (v1, 8 total)

| Tool                 | Args                                                | Returns                                                                                |
| -------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `get_about`          | none                                                | Founder bio, mission, tagline                                                          |
| `get_services`       | `category?: string`                                 | Service catalog (4 listings: OpenClaw deployment, Automation, Claude Code, Knowledge Base) |
| `get_pricing`        | `service: string, tier?: starter\|standard\|premium` | Pricing tier details                                                                   |
| `get_case_studies`   | `topic?: string`                                    | Anonymized case studies                                                                |
| `get_strategy_thesis`| none                                                | Public-safe Avem Strategy v3 summary (4 Säulen)                                        |
| `book_consultation`  | `urgency?: this_week\|flexible`                     | Cal.com URL + hint text                                                                |
| `get_content`        | `limit?: number, type?: newsletter\|social`         | Recent Beehiiv posts (5min cache)                                                      |
| `get_open_source`    | `category?: string`                                 | Public GitHub repos                                                                    |

## Stack

- **Runtime:** Cloudflare Workers (V8 Isolates, edge)
- **Framework:** [Hono](https://hono.dev/) 4.12
- **MCP SDK:** `@modelcontextprotocol/sdk@1.29.0` (pinned)
- **Transport:** Streamable HTTP (MCP-Spec-Default 2026)
- **Validation:** Zod 3.25 (strict-parse pattern)
- **Tests:** Vitest 4.1

## Setup

```bash
# 1. Install
npm install

# 2. Configure secrets (one-time, see wrangler.toml comments)
wrangler secret put BEEHIIV_API_KEY --env production
wrangler secret put GITHUB_TOKEN --env production

# 3. Sync curated content from Jarvis strategy folder
npm run sync

# 4. Local dev
npm run dev   # Listens on http://localhost:8787/mcp

# 5. Deploy
npm run deploy:production
```

## DNS Setup (Cloudflare Dashboard, one-time)

After first deploy:

1. `wrangler deploy --env production` gibt eine Worker-URL aus (z.B. `avem-mcp-server.<account>.workers.dev`)
2. Cloudflare Dashboard → `avemhq.com` Zone → **Workers Routes** → bestätigen dass `mcp.avemhq.com/*` auf den Worker zeigt
3. Falls Custom Domain noch nicht aktiv: **Workers & Pages → avem-mcp-server → Settings → Domains → Custom Domain hinzufügen → `mcp.avemhq.com`**
4. SSL/TLS: Full (Strict)
5. Verify: `curl https://mcp.avemhq.com/.well-known/mcp.json`

## Client Setup

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "avem": {
      "url": "https://mcp.avemhq.com/mcp"
    }
  }
}
```

### Cursor / Cline / Continue

Siehe jeweilige MCP-Konfigurations-Doku — Endpoint ist `https://mcp.avemhq.com/mcp`.

### MCP Inspector (dev)

```bash
npx @modelcontextprotocol/inspector https://mcp.avemhq.com/mcp
```

## Data Source

Statische Tool-Daten in `src/data/*.json` werden via `scripts/sync-from-jarvis-strategy.sh` aus dem Jarvis-Strategy-Folder kuratiert (manual trigger pre-deploy). Single-Source-of-Truth bleibt Jarvis (`second-brain-documents/strategy/`).

Live-Daten (Beehiiv, GitHub) werden direkt von den jeweiligen APIs gequeriet, mit 5-Min-Cache via Cloudflare Cache API.

## Architektur-Entscheidung: Warum Cloudflare Workers statt Vercel?

Vercel-Webseite-Repo ist Vite-SPA, kein Next.js. Vercels offizielles `mcp-handler@1.1.0` braucht Next.js als peer. Drei Pfade evaluiert (Plan v2):

1. ❌ **Vercel-Vite + Plain Functions:** Mehr Custom-Code, MCP-Protocol manuell implementieren
2. ❌ **Vercel Separates Next.js Mini-Repo:** Zweites Vercel-Project, mehr Tooling
3. ✅ **Cloudflare Workers:** DNS ist eh Cloudflare (`avemhq.com` Zone), `iceener/streamable-mcp-server-template` als Pattern, edge-Latenz weltweit, free tier reicht für v1

Details: `~/.claude/plans/joyful-seeking-gadget.md` Korrektur 1.

## Walk-the-Talk

- Avem-Webseite Footer (`02 Avem Investment GmbH/Webseite`): "Talk to Avem via MCP: `mcp.avemhq.com`"
- `stack.avemhq.com` Tool-Karte (Sprint 1 Phase E, post-deploy)
- Newsletter-Draft (Stage-B-Pipeline-Hold-Mechanism): "We just shipped Avem's MCP server — here's why"

## License

Proprietary © Avem Investment GmbH 2026. Tool-Outputs (services, pricing, case-studies) sind public-readable. Code-Privacy: ja (private repo).
