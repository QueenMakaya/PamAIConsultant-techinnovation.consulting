import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import {
  HOUSING_TYPES,
  INTERESTS,
  ORIENTATION_FACTOR,
  QUALIFIED_SCORE,
  REGIONS,
  TIMELINES,
  estimate,
  scoreLead,
} from "@/lib/solar-estimate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Solfutur: Business Hub › Leads. IDs are not secret; the token is.
const BASE = process.env.SOLAIRE_AIRTABLE_BASE || "app9VN2Psgpctl9dE"
const TABLE = "tblcMnYF6NykmPQOD"
const F = {
  name: "fld100KQ1GQGzuIA7",
  email: "fldsDkedSpkMiFpPx",
  phone: "flddGY69pQqBCQPWi",
  city: "fldpKf29W91KO1toL",
  postalCode: "fldkZW132MSb8FnQl",
  region: "flddMkUfPOiPJzXSB",
  housing: "fldEmXUVme43hU86I",
  owner: "fldslzHYp7LDvnZAl",
  annualBill: "fldV3hHvQRR7d5GHK",
  orientation: "fldiAVefwNOgN4oaH",
  timeline: "fldyZLMnLXWZyegIq",
  interests: "fldvYHUC0fX1Nw6oT",
  kw: "fldAf8S48uvMGSG6p",
  subsidy: "fldQDCohDjLniFD1r",
  score: "fldPedaPzybDNO2S6",
  status: "fldxV7ajwcKwyFDfb",
  source: "fld6tewUMsmne2sKc",
  message: "fldRyrUCD3L4h1fve",
  consentContact: "fldhayvfO5yveEFBj",
  consentNewsletter: "fldIfZvNxssTkcXMG",
  receivedAt: "fldNNNV7dRoEq6wMV",
} as const

const LeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
  postalCode: z
    .string()
    .trim()
    .max(10)
    .optional()
    .default("")
    .transform((v) => v.toUpperCase()),
  region: z.enum(REGIONS),
  housing: z.enum(HOUSING_TYPES),
  owner: z.boolean(),
  annualBill: z.coerce.number().min(0).max(200000),
  orientation: z.string().refine((v) => v in ORIENTATION_FACTOR),
  timeline: z.enum(TIMELINES),
  interests: z.array(z.enum(INTERESTS)).max(INTERESTS.length).optional().default([]),
  message: z.string().trim().max(2000).optional().default(""),
  source: z.string().trim().max(200).optional().default(""),
  // Law 25 / CASL: contact consent is mandatory, the newsletter is opt-in.
  consentContact: z.literal(true),
  consentNewsletter: z.boolean().optional().default(false),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(0).optional().default(""),
})

export async function POST(request: NextRequest) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }

  const parsed = LeadSchema.safeParse(raw)
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join("."))
    // A filled honeypot looks like success to the bot, but nothing is stored.
    if (fields.includes("website")) return NextResponse.json({ ok: true })
    return NextResponse.json({ ok: false, error: "invalid", fields }, { status: 400 })
  }

  const lead = parsed.data
  const token = process.env.AIRTABLE_TOKEN
  if (!token) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 })
  }

  const est = estimate(lead.annualBill, lead.orientation, lead.housing)
  const score = scoreLead(lead)

  try {
    const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        typecast: false,
        records: [
          {
            fields: {
              [F.name]: lead.name,
              [F.email]: lead.email,
              ...(lead.phone ? { [F.phone]: lead.phone } : {}),
              [F.city]: lead.city,
              [F.postalCode]: lead.postalCode,
              [F.region]: lead.region,
              [F.housing]: lead.housing,
              [F.owner]: lead.owner,
              [F.annualBill]: lead.annualBill,
              [F.orientation]: lead.orientation,
              [F.timeline]: lead.timeline,
              [F.interests]: lead.interests,
              [F.kw]: est.systemKw,
              [F.subsidy]: est.subsidy,
              [F.score]: score,
              [F.status]: score >= QUALIFIED_SCORE ? "Qualifié" : "Nouveau",
              [F.source]: lead.source || "solfutur.ca",
              [F.message]: lead.message,
              [F.consentContact]: true,
              [F.consentNewsletter]: lead.consentNewsletter,
              [F.receivedAt]: new Date().toISOString(),
            },
          },
        ],
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error("solar-lead airtable error", res.status, detail.slice(0, 300))
      return NextResponse.json({ ok: false, error: "airtable" }, { status: 502 })
    }

    return NextResponse.json({ ok: true, estimate: est })
  } catch (error) {
    console.error("solar-lead fetch failed", error)
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 502 })
  }
}
