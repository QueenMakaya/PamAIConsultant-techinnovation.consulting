import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { escapeHtml, sendEmail } from "@/lib/content-ops/notify"
import {
  AVAILABILITY,
  GOALS,
  MRC_CHOICES,
  ONLINE_PRESENCE,
  normalizeEmail,
  normalizePhone,
  normalizePostalCode,
  normalizeWebsite,
  reviewFlags,
  tidyName,
} from "@/lib/lead-quality"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Prospects & Découverte — Tech Innovation › Prospects. IDs are not secret; the token is.
const BASE = process.env.PROSPECTS_AIRTABLE_BASE || "app6ZvESmGCIHegrD"
const TABLE = "tblWSHtoR9VxJPTuu"
const F = {
  name: "fldK9KNdtgIYADotf",
  company: "fldGCCfAz6kdkwjwa",
  email: "fldee5MljOuznCUg4",
  phone: "fld8XFFi76AiLjZyu",
  cityCountry: "fldUqy9rrDTQhLh3U",
  market: "fldcnMalWSmLF9Jkr",
  services: "fldVLMaSsWdN9obiu",
  presence: "fldxEMdx49aNFTKFX",
  goal: "fldjIv9GYfWmkMa83",
  heardFrom: "fldxW8gApDPIX3MD8",
  message: "fld9fIlTKIfdfv7Ht",
  status: "fldt4xhAI0oRx6s5f",
  nextStep: "fldF4U531nOsskkmR",
  website: "fldlkczlhe6Qp6GqZ",
  mrc: "fldlEoixmJlSZBqhv",
  postalCode: "fldqnWpT4UlicAnoh",
  campaign: "fld25fN07n3zolW0r",
  confirmed: "fldI6HaOGlsBBnIV7",
  consent: "fldblEtFIODNrCOpo",
  availability: "flduCFx14MNYBBqEg",
  receivedAt: "fldTobK6XrNKSnTeB",
  toCheck: "fldSQT9Mf7tCSD0Ay",
} as const

// Every contact field is normalized here; a value that cannot be normalized is
// rejected with the field name so the form can point at it.
const LeadSchema = z.object({
  name: z.string().trim().min(3).max(120).regex(/\S\s+\S/, "full_name").transform(tidyName),
  company: z.string().trim().min(2).max(160),
  email: z.string().trim().max(200).email().transform(normalizeEmail),
  phone: z
    .string()
    .max(40)
    .transform((v, ctx) => {
      const phone = normalizePhone(v)
      if (!phone) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "phone" })
      return phone ?? ""
    }),
  city: z.string().trim().min(2).max(120),
  mrc: z.enum(MRC_CHOICES),
  postalCode: z
    .string()
    .max(10)
    .transform((v, ctx) => {
      const code = normalizePostalCode(v)
      if (!code) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "postal_code" })
      return code ?? ""
    }),
  website: z
    .string()
    .trim()
    .max(300)
    .optional()
    .default("")
    .transform((v, ctx) => {
      if (!v) return ""
      const url = normalizeWebsite(v)
      if (!url) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "website" })
      return url ?? ""
    }),
  services: z.string().trim().min(3).max(600),
  presence: z.array(z.enum(ONLINE_PRESENCE)).min(1).max(ONLINE_PRESENCE.length),
  goal: z.enum(GOALS),
  availability: z.enum(AVAILABILITY),
  heardFrom: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
  campaign: z.string().trim().max(200).optional().default(""),
  // The prospect re-read the normalized values on screen and confirmed them.
  confirmed: z.literal(true),
  // Law 25 / CASL: consent to be contacted about this request is mandatory.
  consentContact: z.literal(true),
  // Honeypot: real visitors never see or fill this field.
  website2: z.string().max(0).optional().default(""),
})

type Lead = z.infer<typeof LeadSchema>

async function airtable(path: string, init: RequestInit, token: string): Promise<Response> {
  return fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  })
}

// One row per business contact: a second request from the same address updates
// the existing row instead of creating a duplicate.
async function findByEmail(email: string, token: string): Promise<string | null> {
  const formula = `LOWER({Courriel})='${email.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
  const res = await airtable(`?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`, { method: "GET" }, token)
  if (!res.ok) return null
  const page = (await res.json()) as { records?: { id: string }[] }
  return page.records?.[0]?.id ?? null
}

async function store(lead: Lead, flags: string[], token: string): Promise<"created" | "updated"> {
  const existing = await findByEmail(lead.email, token)
  const allFlags = existing ? [...flags, "Deuxième demande de ce courriel : la fiche existante a été mise à jour."] : flags
  const fields: Record<string, unknown> = {
    [F.name]: lead.name,
    [F.company]: lead.company,
    [F.email]: lead.email,
    [F.phone]: lead.phone,
    [F.cityCountry]: `${lead.city}, Québec, Canada`,
    [F.market]: "Québec",
    [F.services]: lead.services,
    [F.presence]: lead.presence,
    [F.goal]: lead.goal,
    [F.heardFrom]: lead.heardFrom,
    [F.message]: lead.message,
    [F.mrc]: lead.mrc,
    [F.postalCode]: lead.postalCode,
    [F.campaign]: lead.campaign || "lanaudiere",
    [F.confirmed]: true,
    [F.consent]: true,
    [F.availability]: lead.availability,
    [F.receivedAt]: new Date().toISOString(),
    [F.toCheck]: allFlags.join("\n"),
    ...(lead.website ? { [F.website]: lead.website } : {}),
    // Pipeline fields are only set on a new row, never reset on an update.
    ...(existing ? {} : { [F.status]: "Nouveau", [F.nextStep]: "Fixer la consultation d'une heure (Lanaudière)" }),
  }
  const res = await airtable(
    "",
    {
      method: existing ? "PATCH" : "POST",
      body: JSON.stringify({ typecast: false, records: [existing ? { id: existing, fields } : { fields }] }),
    },
    token,
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`airtable ${res.status}: ${detail.slice(0, 300)}`)
  }
  return existing ? "updated" : "created"
}

function recapRows(lead: Lead): [string, string][] {
  return [
    ["Nom", lead.name],
    ["Entreprise", lead.company],
    ["Courriel", lead.email],
    ["Téléphone", lead.phone],
    ["Ville", `${lead.city} (${lead.mrc})`],
    ["Code postal", lead.postalCode],
    ["Site web", lead.website || "Aucun"],
    ["Activité", lead.services],
    ["Présence en ligne", lead.presence.join(", ")],
    ["Objectif", lead.goal],
    ["Disponibilité", lead.availability],
  ]
}

function recapHtml(rows: [string, string][]): string {
  return `<table style="border-collapse:collapse;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 14px 4px 0;color:#555;vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`,
    )
    .join("")}</table>`
}

const wrap = (body: string) =>
  `<!doctype html><html><body style="margin:0;font-family:Helvetica,Arial,sans-serif;color:#1a1a2e"><div style="max-width:560px;margin:0 auto;padding:28px 22px">${body}<p style="margin-top:28px;font-size:12px;color:#777">Tech Innovation Consulting · Terrebonne (Québec) · pam@techinnovation.consulting</p></div></body></html>`

async function notify(lead: Lead, flags: string[], stored: string): Promise<boolean> {
  const rows = recapRows(lead)
  const text = rows.map(([k, v]) => `${k} : ${v}`).join("\n")
  const flagText = flags.length ? `\n\nÀ vérifier :\n- ${flags.join("\n- ")}` : "\n\nRien à vérifier : tous les contrôles automatiques ont passé."
  const flagHtml = flags.length
    ? `<p><strong>À vérifier avant l'appel</strong></p><ul>${flags.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>`
    : `<p>Rien à vérifier : tous les contrôles automatiques ont passé.</p>`

  // Internal alert first: it doubles as the backup copy if Airtable refused the row.
  const internal = await sendEmail(
    process.env.NOTIFY_EMAIL || "",
    `Nouvelle demande de consultation : ${lead.company} (${lead.city})`,
    wrap(
      `<h1 style="font-size:20px">Nouvelle demande · consultation Lanaudière</h1>${recapHtml(rows)}${flagHtml}${
        lead.message ? `<p><strong>Message</strong><br>${escapeHtml(lead.message)}</p>` : ""
      }<p style="font-size:13px;color:#555">Airtable : ${escapeHtml(stored)}</p>`,
    ),
    `${text}${flagText}${lead.message ? `\n\nMessage : ${lead.message}` : ""}\n\nAirtable : ${stored}`,
  )

  // The prospect gets the same recap: a wrong address bounces, a wrong detail gets corrected by reply.
  const firstName = lead.name.split(" ")[0]
  await sendEmail(
    lead.email,
    "Votre consultation gratuite d'une heure : bien reçu",
    wrap(
      `<h1 style="font-size:20px">Bonjour ${escapeHtml(firstName)}, c'est bien reçu.</h1><p>Je vous écris d'ici un jour ouvrable pour fixer l'heure de votre consultation gratuite.</p><p>Voici ce que j'ai noté. Si un détail est inexact, répondez simplement à ce courriel pour le corriger.</p>${recapHtml(rows)}<p>À très bientôt,<br>Pamela Alfred<br>Tech Innovation Consulting</p>`,
    ),
    `Bonjour ${firstName}, c'est bien reçu.\n\nJe vous écris d'ici un jour ouvrable pour fixer l'heure de votre consultation gratuite.\n\nVoici ce que j'ai noté. Si un détail est inexact, répondez à ce courriel pour le corriger.\n\n${text}\n\nPamela Alfred\nTech Innovation Consulting`,
  )
  return internal.sent
}

export async function POST(request: NextRequest) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }

  const parsed = LeadSchema.safeParse(raw)
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))]
    // A filled honeypot looks like success to the bot, but nothing is stored.
    if (fields.includes("website2")) return NextResponse.json({ ok: true })
    return NextResponse.json({ ok: false, error: "invalid", fields }, { status: 400 })
  }

  const lead = parsed.data
  const flags = reviewFlags(lead)

  let stored = "non enregistré"
  const token = process.env.AIRTABLE_TOKEN
  if (token) {
    try {
      stored = (await store(lead, flags, token)) === "created" ? "nouvelle fiche créée" : "fiche existante mise à jour"
    } catch (error) {
      console.error("consultation-lead airtable failed", error)
      stored = "ÉCHEC de l'enregistrement : cette demande n'existe que dans ce courriel"
    }
  } else {
    stored = "ÉCHEC (AIRTABLE_TOKEN manquant) : cette demande n'existe que dans ce courriel"
  }

  const notified = await notify(lead, flags, stored)
  const saved = !stored.startsWith("ÉCHEC")

  // The request is only lost if it reached neither Airtable nor Pam's inbox.
  if (!saved && !notified) {
    return NextResponse.json({ ok: false, error: "not_saved" }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
