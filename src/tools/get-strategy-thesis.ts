import { z } from 'zod'
import { strategyThesisData } from '../lib/data.ts'

export const getStrategyThesisSchema = z.object({}).strict()

export const getStrategyThesisDefinition = {
  name: 'get_strategy_thesis',
  description:
    'Returns the public-safe summary of Avem Strategy v3 — Platform Play (4 pillars: S0 Upwork, SI Experiment, SII Platform, SIII Audience). Useful for understanding where Avem is heading and why a current engagement might fit.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
}

export function getStrategyThesisHandler(_args: unknown): unknown {
  return strategyThesisData
}
