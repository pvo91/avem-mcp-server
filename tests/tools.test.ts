import { describe, expect, it } from 'vitest'
import { aboutData, pricingData, servicesData } from '../src/lib/data.ts'
import { bookConsultationHandler } from '../src/tools/book-consultation.ts'
import { getAboutHandler } from '../src/tools/get-about.ts'
import { getCaseStudiesHandler } from '../src/tools/get-case-studies.ts'
import { getPricingHandler } from '../src/tools/get-pricing.ts'
import { getServicesHandler } from '../src/tools/get-services.ts'
import { getStrategyThesisHandler } from '../src/tools/get-strategy-thesis.ts'
import { TOOL_DEFINITIONS } from '../src/server.ts'

describe('Tool Definitions', () => {
  it('exposes exactly 8 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(8)
  })

  it('every tool has name, description, inputSchema', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.name).toBeTruthy()
      expect(tool.description).toBeTruthy()
      expect(tool.inputSchema).toBeDefined()
      expect(tool.inputSchema.type).toBe('object')
    }
  })

  it('tool names are unique', () => {
    const names = TOOL_DEFINITIONS.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('get_about', () => {
  it('returns founder + company + mission', () => {
    const result = getAboutHandler({}) as typeof aboutData
    expect(result.founder.name).toBe('Patric Vogel')
    expect(result.company.tagline).toBe('Systems over headcount.')
    expect(result.mission).toContain('one person')
  })
})

describe('get_services', () => {
  it('returns all 4 listings when no category filter', () => {
    const result = getServicesHandler({}) as typeof servicesData
    expect(result.listings).toHaveLength(4)
  })

  it('filters by category', () => {
    const result = getServicesHandler({ category: 'claude_code' }) as {
      listings: typeof servicesData.listings
    }
    expect(result.listings).toHaveLength(1)
    expect(result.listings[0]?.slug).toBe('claude-code-setup')
  })

  it('rejects invalid category', () => {
    expect(() => getServicesHandler({ category: 123 })).toThrow()
  })
})

describe('get_pricing', () => {
  it('returns all tiers when no tier filter', () => {
    const result = getPricingHandler({ service: 'openclaw-deployment' }) as {
      service: string
      tiers: typeof pricingData['openclaw-deployment']
    }
    expect(result.service).toBe('openclaw-deployment')
    expect(Object.keys(result.tiers)).toEqual(['starter', 'standard', 'premium'])
  })

  it('returns single tier when tier filter set', () => {
    const result = getPricingHandler({
      service: 'claude-code-setup',
      tier: 'premium',
    }) as { service: string; tier: string; price_usd: number; outcome: string }
    expect(result.tier).toBe('premium')
    expect(result.price_usd).toBe(5000)
    expect(result.outcome).toBeTruthy()
  })

  it('rejects unknown service', () => {
    expect(() => getPricingHandler({ service: 'unknown' })).toThrow()
  })

  it('rejects unknown tier', () => {
    expect(() =>
      getPricingHandler({ service: 'openclaw-deployment', tier: 'enterprise' }),
    ).toThrow()
  })
})

describe('get_case_studies', () => {
  it('returns primary case study', () => {
    const result = getCaseStudiesHandler({}) as {
      primary: { title: string; monthly_cost_breakdown: { 'Total approx': number } }
    }
    expect(result.primary.title).toContain('20+ Agent')
    expect(result.primary.monthly_cost_breakdown['Total approx']).toBe(1337)
  })
})

describe('get_strategy_thesis', () => {
  it('returns 4 pillars S0-SIII', () => {
    const result = getStrategyThesisHandler({}) as {
      pillars: Array<{ id: string }>
    }
    expect(result.pillars).toHaveLength(4)
    expect(result.pillars.map((p) => p.id)).toEqual(['S0', 'SI', 'SII', 'SIII'])
  })
})

describe('book_consultation', () => {
  it('returns primary_url + urgency_hint with default flexible', () => {
    const result = bookConsultationHandler({}) as {
      primary_url: string
      urgency_hint: string
    }
    expect(result.primary_url).toContain('cal.com/jarvis-xlrw3p')
    expect(result.urgency_hint.toLowerCase()).toContain('exploratory')
  })

  it('returns this_week hint when urgent', () => {
    const result = bookConsultationHandler({ urgency: 'this_week' }) as {
      urgency_hint: string
    }
    expect(result.urgency_hint.toLowerCase()).toContain('urgent')
  })

  it('rejects unknown urgency', () => {
    expect(() => bookConsultationHandler({ urgency: 'maybe' })).toThrow()
  })
})
