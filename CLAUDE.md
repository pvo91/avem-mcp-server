# avem-mcp-server

Cloudflare Worker (hono) hinter `https://mcp.avemhq.com`, MCP-Server für Avem-Werkzeuge. Runtime-Abhängigkeiten sind `hono` und `zod` (das MCP-Protokoll spricht der eigene JSON-RPC-Handler `src/lib/json-rpc.ts`, die SDK ist seit 07.10.2026 entfernt); alles andere ist Dev-Tooling und landet nie im Worker-Bundle.

## Abhängigkeiten pflegen

- **wrangler und `@cloudflare/workers-types` immer zusammen bumpen.** `wrangler` deklariert `@cloudflare/workers-types` als `peerOptional` mit einem Mindestdatum (z.B. `^5.20260910.1`); ein Einzel-Bump von wrangler bricht mit ERESOLVE ab. Beide in einem Aufruf: `npm install --save-exact wrangler@<X> @cloudflare/workers-types@<Y>`. Zweimal bezahlt (17.08.2026, Finding `bd99d6071105`; 11.09.2026, Dispatcher-Lauf), deshalb steht es hier.
- Exakte Pins (`save-exact=true`), kein `--force`, kein `--legacy-peer-deps`.
- **`overrides.sharp` in package.json (seit 08.10.2026):** miniflare pinnt `sharp` exakt, auch in 5.20261006.0-alpha (wrangler 4.148.0) noch auf 0.35.4 mit GHSA-wq5f-xc86-pv6w (librsvg, betroffen <0.35.5). Der Override hebt es auf den Patch 0.35.5, gleiche Linie. Nur Dev-Kette (lokale Bild-Emulation in `wrangler dev`), nie im Worker-Bundle. **Entfernen, sobald** `npm view miniflare@<Version aus dem Lockfile> dependencies.sharp` 0.35.5 oder höher zeigt; bei jedem wrangler-Bump prüfen. Ein stehengelassener Override hält sharp später fest, auch wenn miniflare eine neuere Version verlangt.
- **Major-Bumps nur mit Patric:** `typescript` 7, `zod` 4 (Laufzeit-Schemas), `vitest` 5. Seit 14.09.2026 stehen die drei in `.github/dependabot.yml` auf `ignore` für Majors (Security-Updates kommen weiterhin als PR); ein Major-Bump ist ein bewusster eigener PR, zod 4 mit Schema-Tests.

## Gate vor jedem Commit

```
npm ci                          # aus dem committeten Lockfile
npm audit --audit-level=high    # Exit 0 erwartet
npm run typecheck && npm run lint && npm test
```

Die CI (`.github/workflows/ci.yml`) führt typecheck, lint und Tests aus, seit 08.10.2026 auch den Audit in zwei Stufen (Patric-Entscheid 08.10.2026, wie startup-finance-toolkit): `npm audit --omit=dev --audit-level=high` für die ausgelieferten Pakete und `npm audit --audit-level=critical` für alle. Eine high-Lücke nur in der Dev-Kette lässt die CI also grün, das lokale Gate oben fängt sie weiterhin. Die CI läuft nur bei PR-Änderungen und Pushes nach main, eine neu veröffentlichte Advisory färbt einen unveränderten PR erst beim nächsten Lauf.

## Nach einem Runtime-Bump: Deploy ist Teil des Fixes

Ein gemergter `hono`- oder `zod`-Bump ist erst geschlossen, wenn der Worker neu deployt ist. `npm run deploy:production` braucht Patrics wrangler-OAuth-Login (Patric führt aus). Nachweis: `curl -sI https://mcp.avemhq.com` liefert HTTP 200, Version und Datum in `.claude/findings/resolved/0b55d38bc2a5.md` nachtragen (gelebte Praxis seit 04.09.2026).

## Findings

`.claude/findings/` (open, resolved, `_INDEX.md`), Pflege über `/findings-track`.
