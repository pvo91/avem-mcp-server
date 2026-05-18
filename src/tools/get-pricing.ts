import { z } from 'zod'
import { pricingData } from '../lib/data.ts'

export const getPricingSchema = z
  .object({
    service: z.enum([
      'openclaw-deployment',
      'automation-pipeline',
      'claude-code-setup',
      'knowledge-base',
    ]),
    tier: z.enum(['starter', 'standard', 'premium']).optional(),
  })
  .strict()

export const getPricingDefinition = {
  name: 'get_pricing',
  description:
    'Returns pricing tier details for an Avem service. Required: service slug. Optional: specific tier (else returns all three).',
  inputSchema: {
    type: 'object',
    required: ['service'],
    properties: {
      service: {
        type: 'string',
        enum: ['openclaw-deployment', 'automation-pipeline', 'claude-code-setup', 'knowledge-base'],
        description: 'Service slug (must match get_services output).',
      },
      tier: {
        type: 'string',
        enum: ['starter', 'standard', 'premium'],
        description: 'Optional tier filter.',
      },
    },
    additionalProperties: false,
  },
}

export function getPricingHandler(args: unknown): unknown {
  const parsed = getPricingSchema.parse(args)
  const servicePricing = pricingData[parsed.service]
  if (!servicePricing) {
    throw new Error(`Unknown service slug: ${parsed.service}`)
  }
  if (parsed.tier) {
    const tier = servicePricing[parsed.tier]
    if (!tier) throw new Error(`Unknown tier: ${parsed.tier}`)
    return { service: parsed.service, tier: parsed.tier, ...tier }
  }
  return { service: parsed.service, tiers: servicePricing }
}
