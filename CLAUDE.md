# avem-mcp-server

Cloudflare Worker (hono) hinter `https://mcp.avemhq.com`, MCP-Server für Avem-Werkzeuge. Runtime-Abhängigkeiten sind `hono`, `@modelcontextprotocol/sdk` und `zod`; alles andere ist Dev-Tooling und landet nie im Worker-Bundle.

## Abhängigkeiten pflegen

- **wrangler und `@cloudflare/workers-types` immer zusammen bumpen.** `wrangler` deklariert `@cloudflare/workers-types` als `peerOptional` mit einem Mindestdatum (z.B. `^5.20260910.1`); ein Einzel-Bump von wrangler bricht mit ERESOLVE ab. Beide in einem Aufruf: `npm install --save-exact wrangler@<X> @cloudflare/workers-types@<Y>`. Zweimal bezahlt (17.08.2026, Finding `bd99d6071105`; 11.09.2026, Dispatcher-Lauf), deshalb steht es hier.
- Exakte Pins (`save-exact=true`), kein `--force`, kein `--legacy-peer-deps`.
- **Major-Bumps nur mit Patric:** `typescript` 7, `zod` 4 (Laufzeit-Schemas), `vitest` 5. Dependabot öffnet dafür PRs, sie bleiben offen bis zum Entscheid.

## Gate vor jedem Commit

```
npm ci                          # aus dem committeten Lockfile
npm audit --audit-level=high    # Exit 0 erwartet
npm run typecheck && npm run lint && npm test
```

## Nach einem Runtime-Bump: Deploy ist Teil des Fixes

Ein gemergter `hono`-, SDK- oder `zod`-Bump ist erst geschlossen, wenn der Worker neu deployt ist. `npm run deploy:production` braucht Patrics wrangler-OAuth-Login (Patric führt aus). Nachweis: `curl -sI https://mcp.avemhq.com` liefert HTTP 200, Version und Datum in `.claude/findings/resolved/0b55d38bc2a5.md` nachtragen (gelebte Praxis seit 04.09.2026).

## Findings

`.claude/findings/` (open, resolved, `_INDEX.md`), Pflege über `/findings-track`.
