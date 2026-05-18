import { z } from 'zod'
import { aboutData } from '../lib/data.ts'

export const getAboutSchema = z.object({}).strict()

export const getAboutDefinition = {
  name: 'get_about',
  description:
    'Returns Avem founder bio, company info, mission, and tagline. Use this for introductions or when an agent first connects.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
}

export function getAboutHandler(_args: unknown): unknown {
  // No args; ignore input (schema validates).
  return aboutData
}
