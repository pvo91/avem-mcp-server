// MCP Tool registry + request dispatcher.
// Implements the JSON-RPC methods that MCP clients call:
//   initialize, tools/list, tools/call, ping.
// Spec: https://modelcontextprotocol.io/specification/2024-11-05

import {
  bookConsultationDefinition,
  bookConsultationHandler,
} from './tools/book-consultation.ts'
import {
  getAboutDefinition,
  getAboutHandler,
} from './tools/get-about.ts'
import {
  getCaseStudiesDefinition,
  getCaseStudiesHandler,
} from './tools/get-case-studies.ts'
import {
  getContentDefinition,
  getContentHandler,
} from './tools/get-content.ts'
import type { GetContentEnv } from './tools/get-content.ts'
import {
  getOpenSourceDefinition,
  getOpenSourceHandler,
} from './tools/get-open-source.ts'
import type { GetOpenSourceEnv } from './tools/get-open-source.ts'
import {
  getPricingDefinition,
  getPricingHandler,
} from './tools/get-pricing.ts'
import {
  getServicesDefinition,
  getServicesHandler,
} from './tools/get-services.ts'
import {
  getStrategyThesisDefinition,
  getStrategyThesisHandler,
} from './tools/get-strategy-thesis.ts'

export interface ToolEnv extends GetContentEnv, GetOpenSourceEnv {}

export const TOOL_DEFINITIONS = [
  getAboutDefinition,
  getServicesDefinition,
  getPricingDefinition,
  getCaseStudiesDefinition,
  getStrategyThesisDefinition,
  bookConsultationDefinition,
  getContentDefinition,
  getOpenSourceDefinition,
]

type ToolHandler = (args: unknown, env: ToolEnv) => unknown | Promise<unknown>

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  get_about: (args) => getAboutHandler(args),
  get_services: (args) => getServicesHandler(args),
  get_pricing: (args) => getPricingHandler(args),
  get_case_studies: (args) => getCaseStudiesHandler(args),
  get_strategy_thesis: (args) => getStrategyThesisHandler(args),
  book_consultation: (args) => bookConsultationHandler(args),
  get_content: (args, env) => getContentHandler(args, env),
  get_open_source: (args, env) => getOpenSourceHandler(args, env),
}

export const SERVER_INFO = {
  name: 'avem-mcp-server',
  version: '0.1.0',
  description:
    "Avem Investment GmbH MCP-Server. Walk-the-Talk for 'Systems over headcount' brand.",
} as const

export const SERVER_CAPABILITIES = {
  tools: {
    listChanged: false,
  },
} as const

export const PROTOCOL_VERSION = '2025-03-26'

export async function callTool(
  name: string,
  args: unknown,
  env: ToolEnv,
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  const handler = TOOL_HANDLERS[name]
  if (!handler) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    }
  }
  try {
    const result = await handler(args, env)
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  } catch (e) {
    return {
      isError: true,
      content: [
        { type: 'text', text: e instanceof Error ? e.message : String(e) },
      ],
    }
  }
}
