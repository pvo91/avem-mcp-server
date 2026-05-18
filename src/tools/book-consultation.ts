import { z } from 'zod'
import { calLinkData } from '../lib/data.ts'

export const bookConsultationSchema = z
  .object({
    urgency: z.enum(['this_week', 'flexible']).optional(),
  })
  .strict()

export const bookConsultationDefinition = {
  name: 'book_consultation',
  description:
    'Returns a Cal.com booking URL plus a usage hint. Use when an agent or user wants to schedule a conversation with Avem.',
  inputSchema: {
    type: 'object',
    properties: {
      urgency: {
        type: 'string',
        enum: ['this_week', 'flexible'],
        description: 'Urgency level. Affects which booking guidance is returned.',
      },
    },
    additionalProperties: false,
  },
}

export function bookConsultationHandler(args: unknown): unknown {
  const parsed = bookConsultationSchema.parse(args ?? {})
  const urgency = parsed.urgency ?? 'flexible'
  return {
    primary_url: calLinkData.primary_url,
    events: calLinkData.events,
    urgency_hint: calLinkData.urgency_hints[urgency],
    first_step_hint: calLinkData.first_step_hint,
  }
}
