// Minimal JSON-RPC 2.0 helpers for MCP protocol.
// MCP spec uses JSON-RPC 2.0 over HTTP (Streamable HTTP transport).
// Doc: https://modelcontextprotocol.io/specification

import { z } from 'zod'

export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string(),
  params: z.unknown().optional(),
})

export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>

export interface JsonRpcSuccess<T> {
  jsonrpc: '2.0'
  id: string | number | null
  result: T
}

export interface JsonRpcError {
  jsonrpc: '2.0'
  id: string | number | null
  error: {
    code: number
    message: string
    data?: unknown
  }
}

// Standard JSON-RPC error codes (per spec).
export const RpcErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
} as const

export function ok<T>(id: string | number | null, result: T): JsonRpcSuccess<T> {
  return { jsonrpc: '2.0', id, result }
}

export function err(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcError {
  return { jsonrpc: '2.0', id, error: { code, message, data } }
}
