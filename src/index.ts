// Cloudflare Worker entry. Hono app exposes:
//   GET  /                       — Health check + brief readme
//   GET  /.well-known/mcp.json   — MCP discovery manifest
//   POST /mcp                    — JSON-RPC over Streamable HTTP
//
// CORS is open by design (Walk-the-Talk: agents from any client may discover).
// Rate-limiting is delegated to Cloudflare's edge + per-tool caching (5 min TTL).

import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { JsonRpcRequestSchema, RpcErrorCode, err, ok } from './lib/json-rpc.ts'
import {
  callTool,
  PROTOCOL_VERSION,
  SERVER_CAPABILITIES,
  SERVER_INFO,
  TOOL_DEFINITIONS,
  type ToolEnv,
} from './server.ts'

interface Bindings extends ToolEnv {
  AVEM_PRIMARY_DOMAIN: string
  AVEM_BRAND_TAGLINE: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Open CORS for MCP clients. They may call from Claude Desktop, Cursor,
// any agent harness — origin is unpredictable.
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id'],
    exposeHeaders: ['Mcp-Session-Id'],
    maxAge: 86400,
  }),
)

app.get('/', (c) => {
  return c.text(
    [
      `${SERVER_INFO.name} v${SERVER_INFO.version}`,
      '',
      `Avem Investment GmbH — "${c.env.AVEM_BRAND_TAGLINE}"`,
      `Primary domain: ${c.env.AVEM_PRIMARY_DOMAIN}`,
      '',
      'MCP endpoint: POST /mcp (JSON-RPC 2.0, Streamable HTTP transport).',
      'Discovery:    GET /.well-known/mcp.json',
      '',
      `Tools available (${TOOL_DEFINITIONS.length}):`,
      ...TOOL_DEFINITIONS.map((t) => `  - ${t.name}`),
      '',
      'Setup: https://mcp.avemhq.com/README — or see the avemhq.com footer.',
    ].join('\n'),
  )
})

app.get('/.well-known/mcp.json', (c) => {
  return c.json({
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
    description: SERVER_INFO.description,
    endpoint: `https://${new URL(c.req.url).host}/mcp`,
    transport: 'streamable-http',
    protocol_version: PROTOCOL_VERSION,
    capabilities: SERVER_CAPABILITIES,
    tools: TOOL_DEFINITIONS.map((t) => ({
      name: t.name,
      description: t.description,
    })),
  })
})

app.post('/mcp', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json(
      err(null, RpcErrorCode.ParseError, 'Invalid JSON in request body'),
      400,
    )
  }

  const parsed = JsonRpcRequestSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      err(null, RpcErrorCode.InvalidRequest, 'Not a valid JSON-RPC 2.0 request', {
        zod_error: parsed.error.flatten(),
      }),
    )
  }

  const req = parsed.data
  const id = req.id ?? null

  switch (req.method) {
    case 'initialize': {
      return c.json(
        ok(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: SERVER_CAPABILITIES,
          serverInfo: SERVER_INFO,
        }),
      )
    }

    case 'notifications/initialized': {
      // Client confirms it processed the initialize response. No reply needed
      // per spec (notifications have no id).
      return c.body(null, 204)
    }

    case 'ping': {
      return c.json(ok(id, {}))
    }

    case 'tools/list': {
      return c.json(ok(id, { tools: TOOL_DEFINITIONS }))
    }

    case 'tools/call': {
      const callParams = req.params as { name?: string; arguments?: unknown } | undefined
      if (!callParams?.name) {
        return c.json(
          err(id, RpcErrorCode.InvalidParams, 'Missing required param: name'),
        )
      }
      const result = await callTool(callParams.name, callParams.arguments, c.env)
      return c.json(ok(id, result))
    }

    default:
      return c.json(err(id, RpcErrorCode.MethodNotFound, `Method not found: ${req.method}`))
  }
})

export default app
