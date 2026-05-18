// Static-data loader. JSON files are imported at build time and bundled
// into the Worker. No filesystem reads at runtime.

import aboutJson from '../data/about.json'
import servicesJson from '../data/services.json'
import pricingJson from '../data/pricing.json'
import caseStudiesJson from '../data/case-studies.json'
import strategyThesisJson from '../data/strategy-thesis.json'
import calLinkJson from '../data/cal-link.json'

export const aboutData = aboutJson
export const servicesData = servicesJson
export const pricingData = pricingJson as Record<
  string,
  Record<string, { price_usd: number; delivery_days: number; includes: string[]; outcome: string }>
>
export const caseStudiesData = caseStudiesJson
export const strategyThesisData = strategyThesisJson
export const calLinkData = calLinkJson
