// Soleil Commun: rough residential solar estimate for Quebec homes.
// Shared by the /solaire page (live preview) and /api/solar-lead (stored with
// the lead), so both always agree. Every number here is a stated assumption,
// shown to the visitor as such. Update them when Hydro-Québec rates or the
// LogisVert solar measure change.

export const ASSUMPTIONS = {
  // Blended Hydro-Québec residential energy price, $/kWh (rate D, both tiers).
  pricePerKwh: 0.085,
  // Fixed access charge per year, not offset by solar.
  fixedChargePerYear: 170,
  // Annual production per installed kW, south-facing, southern Quebec.
  kwhPerKwSouth: 1150,
  // Installed cost per kW before incentives (turnkey residential).
  costPerKw: 3000,
  // LogisVert solar measure (Hydro-Québec, 2026): $1,000 per kW, max 40 % of eligible cost.
  subsidyPerKw: 1000,
  subsidyMaxShare: 0.4,
  // Share of yearly consumption the system targets. Quebec homes heat with
  // electricity in winter when solar output is lowest, so we don't size to 100 %.
  targetOffset: 0.6,
  minKw: 3,
  maxKw: 10,
} as const

export const ORIENTATION_FACTOR: Record<string, number> = {
  Sud: 1,
  "Est / Ouest": 0.85,
  "Toit plat": 0.9,
  Nord: 0.65,
  "Je ne sais pas": 0.85,
}

export const HOUSING_TYPES = [
  "Unifamiliale",
  "Jumelé / en rangée",
  "Plex (2-19 logements)",
  "Chalet",
  "Condo",
  "Commerce / entreprise",
] as const

// Condos and large buildings are outside the LogisVert residential solar measure.
export const SUBSIDY_ELIGIBLE_HOUSING = new Set<string>([
  "Unifamiliale",
  "Jumelé / en rangée",
  "Plex (2-19 logements)",
  "Chalet",
])

export const REGIONS = [
  "Montréal",
  "Laval",
  "Rive-Nord",
  "Rive-Sud",
  "Québec (Capitale-Nationale)",
  "Montérégie",
  "Laurentides / Lanaudière",
  "Estrie",
  "Outaouais",
  "Autre",
] as const

export const TIMELINES = ["0-3 mois", "3-6 mois", "6-12 mois", "Je m'informe"] as const

export const INTERESTS = [
  "Panneaux solaires",
  "Batterie",
  "Borne de recharge",
  "Thermopompe",
  "Kit solaire portable",
] as const

export type Estimate = {
  consumptionKwh: number
  systemKw: number
  productionKwh: number
  grossCost: number
  subsidy: number
  netCost: number
  yearlySavings: number
  paybackYears: number | null
  subsidyEligible: boolean
}

const round = (n: number, step = 1) => Math.round(n / step) * step

export function estimate(annualBill: number, orientation: string, housing: string): Estimate {
  const a = ASSUMPTIONS
  const energySpend = Math.max(0, annualBill - a.fixedChargePerYear)
  const consumptionKwh = energySpend / a.pricePerKwh
  const factor = ORIENTATION_FACTOR[orientation] ?? ORIENTATION_FACTOR["Je ne sais pas"]
  const perKw = a.kwhPerKwSouth * factor

  const rawKw = perKw > 0 ? (consumptionKwh * a.targetOffset) / perKw : 0
  const systemKw = consumptionKwh > 0 ? Math.min(a.maxKw, Math.max(a.minKw, round(rawKw, 0.5))) : 0
  const productionKwh = systemKw * perKw
  const grossCost = systemKw * a.costPerKw
  const subsidyEligible = SUBSIDY_ELIGIBLE_HOUSING.has(housing)
  const subsidy = subsidyEligible ? Math.min(systemKw * a.subsidyPerKw, grossCost * a.subsidyMaxShare) : 0
  const netCost = grossCost - subsidy
  // Savings can't exceed what the household actually spends on energy.
  const yearlySavings = Math.min(productionKwh * a.pricePerKwh, energySpend)
  const paybackYears = yearlySavings > 0 ? netCost / yearlySavings : null

  return {
    consumptionKwh: round(consumptionKwh, 100),
    systemKw,
    productionKwh: round(productionKwh, 100),
    grossCost: round(grossCost, 100),
    subsidy: round(subsidy, 100),
    netCost: round(netCost, 100),
    yearlySavings: round(yearlySavings, 10),
    paybackYears: paybackYears == null ? null : Math.round(paybackYears),
    subsidyEligible,
  }
}

// 0-100 lead score used to sort the Leads table and decide who goes to a partner.
export function scoreLead(input: {
  owner: boolean
  housing: string
  annualBill: number
  timeline: string
  orientation: string
}): number {
  let score = 0
  if (input.owner) score += 30
  if (SUBSIDY_ELIGIBLE_HOUSING.has(input.housing)) score += 20
  else if (input.housing === "Commerce / entreprise") score += 15
  if (input.annualBill >= 2500) score += 20
  else if (input.annualBill >= 1500) score += 10
  if (input.timeline === "0-3 mois") score += 25
  else if (input.timeline === "3-6 mois") score += 15
  else if (input.timeline === "6-12 mois") score += 5
  if (input.orientation === "Sud" || input.orientation === "Toit plat") score += 5
  return Math.min(100, score)
}

export const QUALIFIED_SCORE = 60
