// The business registry: one row per business (client or Pam's own venture)
// in the Airtable base "Content Ops · Registre des entreprises". Adding a
// business = adding a row there; no code change, no redeploy.
//
// If the registry cannot be read (e.g. the Airtable token was not yet given
// access to the registry base), the portal falls back to LEGACY so existing
// client links keep working.

import { listRecords, asString } from "./airtable"
import { APPROVED, ADJUST, type FieldKey } from "./standard"

export const REGISTRY_BASE = process.env.CONTENT_OPS_REGISTRY_BASE || "appd1aIODMuFi1tWO"
export const REGISTRY_TABLE = process.env.CONTENT_OPS_REGISTRY_TABLE || "tbletjExi0LOwhLZe"

export type Business = {
  slug: string
  name: string
  kind: "client" | "own"
  active: boolean
  base: string
  table: string
  view?: string
  // Portal token stored in the registry (new businesses).
  token?: string
  // Name of the Vercel env var holding a token already sent to the client.
  tokenEnv?: string
  approverName: string
  approverEmail: string
  fieldOverrides: Partial<Record<FieldKey, string>>
  labels: { approved: string; adjust: string }
  hideOverdue: boolean
  reminders: boolean
  metricoolBrand: string
}

const FIELD_KEYS: FieldKey[] = [
  "title", "date", "channel", "format", "caption", "hashtags",
  "link", "visuals", "status", "approval", "comment",
]

// "approval = Validation Marye" lines → { approval: "Validation Marye" }
export function parseOverrides(text: string): Partial<Record<FieldKey, string>> {
  const out: Partial<Record<FieldKey, string>> = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([a-z]+)\s*[=:]\s*(.+?)\s*$/i)
    if (!match) continue
    const key = match[1].toLowerCase() as FieldKey
    if (FIELD_KEYS.includes(key)) out[key] = match[2]
  }
  return out
}

function fromRegistryRow(f: Record<string, unknown>): Business | null {
  const slug = asString(f["Slug"]).trim()
  const base = asString(f["Base ID"]).trim()
  const table = asString(f["Table ID"]).trim()
  if (!slug || !base || !table) return null
  return {
    slug,
    name: asString(f["Entreprise"]).trim() || slug,
    kind: asString(f["Type"]) === "Mon entreprise" ? "own" : "client",
    active: f["Actif"] === true,
    base,
    table,
    view: asString(f["Vue"]).trim() || undefined,
    token: asString(f["Jeton portail"]).trim() || undefined,
    tokenEnv: asString(f["Variable jeton (ancien)"]).trim() || undefined,
    approverName: asString(f["Approbateur"]).trim(),
    approverEmail: asString(f["Courriel approbateur"]).trim(),
    fieldOverrides: parseOverrides(asString(f["Correspondance champs"])),
    labels: {
      approved: asString(f["Libellé Approuvé"]).trim() || APPROVED,
      adjust: asString(f["Libellé À ajuster"]).trim() || ADJUST,
    },
    hideOverdue: f["Masquer en retard"] === true,
    reminders: f["Rappels courriel"] === true,
    metricoolBrand: asString(f["Marque Metricool"]).trim(),
  }
}

// Fallback only — mirrors the registry rows of the clients that existed before
// the registry, so their links survive a registry outage.
function legacy(
  slug: string, name: string, base: string, table: string, tokenEnv: string,
  overrides: Partial<Record<FieldKey, string>>, extra: Partial<Business> = {},
): Business {
  return {
    slug, name, kind: "client", active: true, base, table, tokenEnv,
    approverName: "", approverEmail: "", fieldOverrides: overrides,
    labels: { approved: APPROVED, adjust: ADJUST },
    hideOverdue: false, reminders: false, metricoolBrand: "",
    ...extra,
  }
}

const LEGACY: Business[] = [
  legacy("annysk", "Anny's K", process.env.AIRTABLE_BASE || "appewRVgrp7nb51ky",
    process.env.AIRTABLE_TABLE || "tbldd33ltZe9ran3d", "VALIDATION_TOKEN",
    { approval: "Approbation Anny", comment: "Commentaire d'Anny (approbation)" }),
  legacy("chafric", "CHAFRIC", "appNTAdE5R06eHkFF", "tbldnauStmzlJRb0l", "CHAFRIC_VALIDATION_TOKEN",
    { comment: "Commentaires CHAFRIC" }, { hideOverdue: true }),
  legacy("okpneus", "OK Pneus Terrebonne", "appzNmBQeCXPUVnff", "tblobreF74oLW96Es", "OKPNEUS_VALIDATION_TOKEN",
    { approval: "Approbation Sam", comment: "Commentaire de Sam" },
    { labels: { approved: "✅ Approuvé", adjust: "✏️ À ajuster" } }),
  legacy("rooma", "ROOMA", "appPuYrpgIa4lIFbn", "tbltCcaNqkF0kkPTm", "ROOMA_VALIDATION_TOKEN",
    { comment: "Commentaires ROOMA" }),
  legacy("folashade", "Folashade", "appS1AZLNH7Smy2Ds", "tbl7mDYDXGHTn69YT", "FOLASHADE_VALIDATION_TOKEN",
    { comment: "Commentaires Folashade" }),
  legacy("ethnika", "Centre Holistic Ethnika", "appbejIYzqSPcOj5W", "tbls1FHLh2VVlFHTU", "ETHNIKA_VALIDATION_TOKEN",
    { comment: "Commentaires Ethnika" }),
  legacy("miboty", "Miboty", "appO6uZiL4CL9qvqs", "tblPwjYmhwf7Q7TlQ", "MIBOTY_VALIDATION_TOKEN",
    { approval: "Validation CUMBA", comment: "Commentaires CUMBA" }),
  legacy("soleil", "Solfutur", "app9VN2Psgpctl9dE", "tbl4QPyBQp2n7Dfpn", "SOLAIRE_VALIDATION_TOKEN",
    { approval: "Validation Pam", comment: "Commentaires Pam" }, { kind: "own" }),
]

let cache: { at: number; businesses: Business[]; source: "registry" | "legacy" } | null = null
const TTL_MS = 60_000

export async function loadBusinesses(): Promise<{ businesses: Business[]; source: "registry" | "legacy" }> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache
  try {
    const rows = await listRecords(REGISTRY_BASE, REGISTRY_TABLE)
    const businesses = rows
      .map((row) => fromRegistryRow(row.fields))
      .filter((b): b is Business => b !== null)
    cache = { at: Date.now(), businesses, source: "registry" }
  } catch (error) {
    console.error("[content-ops] registry unreachable, using legacy list", error)
    // Short cache so a fixed token is picked up quickly.
    cache = { at: Date.now() - TTL_MS + 10_000, businesses: LEGACY, source: "legacy" }
  }
  return cache
}

export function tokensFor(business: Business): string[] {
  const tokens: string[] = []
  if (business.token) tokens.push(business.token)
  if (business.tokenEnv) {
    const fromEnv = process.env[business.tokenEnv]
    if (fromEnv) tokens.push(fromEnv)
  }
  return tokens
}

export async function resolveBusinessByToken(token: unknown): Promise<Business | null> {
  if (typeof token !== "string" || token.length < 8) return null
  const { businesses } = await loadBusinesses()
  return businesses.find((b) => b.active && tokensFor(b).includes(token)) ?? null
}

export function portalUrl(business: Business, origin: string): string | null {
  const token = tokensFor(business)[0]
  return token ? `${origin}/validation?token=${encodeURIComponent(token)}` : null
}

export function siteOrigin(fallback?: string): string {
  return (process.env.SITE_URL || fallback || "https://techinnovation.consulting").replace(/\/$/, "")
}
