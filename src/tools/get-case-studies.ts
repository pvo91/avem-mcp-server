import { z } from 'zod'
import { caseStudiesData } from '../lib/data.ts'

export const getCaseStudiesSchema = z
  .object({
    topic: z.string().optional(),
  })
  .strict()

export const getCaseStudiesDefinition = {
  name: 'get_case_studies',
  description:
    'Returns Avem case studies. Primary case study: "20+ agent AI company for $1,337/month" with architecture, cost breakdown, and key learnings.',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description:
          'Optional topic hint (e.g. "cost", "architecture", "learnings"). Returns the same primary case study; the topic is metadata only for v1.',
      },
    },
    additionalProperties: false,
  },
}

export function getCaseStudiesHandler(args: unknown): unknown {
  // Schema parse only validates; we always return the primary case study in v1.
  getCaseStudiesSchema.parse(args ?? {})
  return caseStudiesData
}
