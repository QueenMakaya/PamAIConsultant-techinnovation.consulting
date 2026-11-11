// Minimal Airtable REST helpers. Records are keyed by field *name* so the same
// code reads every base; names are resolved per business (see posts.ts).

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
  opts: { view?: string } = {},
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = []
  let offset: string | undefined
  do {
    const url = new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`)
    if (opts.view) url.searchParams.set("view", opts.view)
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
