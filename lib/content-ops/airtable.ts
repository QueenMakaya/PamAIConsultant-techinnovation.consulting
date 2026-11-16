// Minimal Airtable REST helpers. Records are keyed by field *name* so the same
// code reads every base; names are resolved per business (see posts.ts).
//
// Reads are cached (Airtable bills API calls per workspace per month): a table
// is fetched from Airtable at most once per CACHE_SECONDS, whoever asks. A
// write through this site invalidates the table right away; an edit made
// directly in Airtable shows up within CACHE_SECONDS, or at once via
// `fresh: true` (the dashboard's "Actualiser").

import { revalidateTag, unstable_cache } from "next/cache"

export const CACHE_SECONDS = 300

const ALL_TAG = "airtable"
const tableTag = (base: string, table: string) => `airtable:${base}:${table}`

// Drop the cached copy of one table, or of everything when called bare.
export function invalidateRecords(base?: string, table?: string): void {
  revalidateTag(base && table ? tableTag(base, table) : ALL_TAG, { expire: 0 })
}

export type AirtableRecord = {
  id: string
  createdTime?: string
  fields: Record<string, unknown>
}

export class AirtableError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(`airtable ${status}`)
  }
}

function token(): string {
  const value = process.env.AIRTABLE_TOKEN
  if (!value) throw new AirtableError(500, "AIRTABLE_TOKEN manquant côté serveur.")
  return value
}

export async function listRecords(
  base: string,
  table: string,
  opts: { view?: string; fresh?: boolean } = {},
): Promise<AirtableRecord[]> {
  if (opts.fresh) {
    invalidateRecords(base, table)
    return fetchRecords(base, table, opts.view)
  }
  // The whole table is cached as one entry (Airtable's pagination cursors
  // expire, so pages cannot be cached one by one). The time bucket in the key
  // makes expiry strict: unstable_cache would otherwise serve an expired entry
  // once more while refreshing it, i.e. hours-old data on a quiet portal.
  const bucket = Math.floor(Date.now() / (CACHE_SECONDS * 1000))
  return unstable_cache(
    () => fetchRecords(base, table, opts.view),
    ["airtable-list", base, table, opts.view ?? "", String(bucket)],
    { revalidate: CACHE_SECONDS, tags: [ALL_TAG, tableTag(base, table)] },
  )()
}

async function fetchRecords(base: string, table: string, view?: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = []
  let offset: string | undefined
  do {
    const url = new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`)
    if (view) url.searchParams.set("view", view)
    if (offset) url.searchParams.set("offset", offset)
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token()}` },
      cache: "no-store",
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      throw new AirtableError(res.status, detail.slice(0, 500))
    }
    const page = (await res.json()) as { records?: AirtableRecord[]; offset?: string }
    records.push(...(page.records ?? []))
    offset = page.offset
  } while (offset)
  return records
}

export async function getRecord(base: string, table: string, recordId: string): Promise<AirtableRecord | null> {
  const res = await fetch(
    `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`,
    { headers: { Authorization: `Bearer ${token()}` }, cache: "no-store" },
  )
  if (res.status === 404) return null
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new AirtableError(res.status, detail.slice(0, 500))
  }
  return (await res.json()) as AirtableRecord
}

export async function updateRecord(
  base: string,
  table: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    cache: "no-store",
    // typecast lets a label like "Approuvé" match the select option by name.
    body: JSON.stringify({ records: [{ id: recordId, fields }], typecast: true }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new AirtableError(res.status, detail.slice(0, 500))
  }
  invalidateRecords(base, table)
}

export function asString(value: unknown): string {
  if (value == null) return ""
  if (Array.isArray(value)) return value.map(asString).filter(Boolean).join(", ")
  if (typeof value === "object") {
    const name = (value as { name?: unknown }).name
    return typeof name === "string" ? name : ""
  }
  return String(value)
}
