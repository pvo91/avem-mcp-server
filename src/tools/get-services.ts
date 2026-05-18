import { z } from 'zod'
import { servicesData } from '../lib/data.ts'

export const getServicesSchema = z
  .object({
    category: z.string().optional(),
  })
  .strict()

export const getServicesDefinition = {
  name: 'get_services',
  description:
    'Returns Avem service catalog. Optionally filter by category (agent_systems, automation, claude_code, knowledge_base).',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['agent_systems', 'automation', 'claude_code', 'knowledge_base'],
        description: 'Optional category filter.',
      },
    },
    additionalProperties: false,
  },
}

export function getServicesHandler(args: unknown): unknown {
  const parsed = getServicesSchema.parse(args ?? {})
  if (!parsed.category) return servicesData

  const filtered = servicesData.listings.filter((l) => l.category === parsed.category)
  return {
    listings: filtered,
    phase_zero_note: servicesData.phase_zero_note,
  }
}
