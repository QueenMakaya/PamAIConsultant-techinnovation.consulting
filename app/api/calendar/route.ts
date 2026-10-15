import { NextResponse, type NextRequest } from "next/server"
import { resolveClient, toCanonicalApproval, type ValidationClient } from "@/lib/validation-clients"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Attachment = {
  id?: string
  url?: string
  filename?: string
  type?: string
  width?: number
  height?: number
  thumbnails?: {
    small?: { url: string }
    large?: { url: string }
    full?: { url: string }
  }
}

// One attachment of a post, ready to render: `preview` feeds the card, `url`
// is the original file (full resolution) behind the lightbox.
export type Visual = {
  id: string
  kind: "image" | "video"
  url: string
  preview: string | null
  filename: string
  width: number | null
  height: number | null
}

type AirtableRecord = {
  id: string
  fields: Record<string, unknown>
}

export type Post = {
  id: string
  title: string
  date: string
  channel: string
  format: string
  caption: string
  hashtags: string
  link: string
  visuals: Visual[]
  approval: string
  comment: string
}

export type Beat = {
  key: string
  number: number
  title: string
  posts: Post[]
}

function asString(value: unknown): string {
  if (value == null) return ""
  if (Array.isArray(value)) return value.map(asString).filter(Boolean).join(", ")
  if (typeof value === "object") {
    const name = (value as { name?: unknown }).name
    return typeof name === "string" ? name : ""
  }
  return String(value)
}

function mapVisuals(value: unknown): Visual[] {
  if (!Array.isArray(value)) return []

  const attachments = (value as Attachment[])
    .map((attachment, index) => ({ attachment, index }))
    .filter(({ attachment }) => typeof attachment?.url === "string" && attachment.url.length > 0)

  // Carousel slides often sit out of order in the cell ("…slide03" first), but
  // their filenames carry the intended order — sort on that, original order
  // breaking ties so unnamed files keep their place.
  const collator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" })
  attachments.sort((a, b) => {
    const byName = collator.compare(a.attachment.filename ?? "", b.attachment.filename ?? "")
    return byName !== 0 ? byName : a.index - b.index
  })

  const visuals: Visual[] = attachments.map(({ attachment, index }) => {
    const isVideo = (attachment.type ?? "").startsWith("video/")
    const preview =
      attachment.thumbnails?.large?.url ??
      attachment.thumbnails?.full?.url ??
      attachment.thumbnails?.small?.url ??
      (isVideo ? null : (attachment.url as string))
    return {
      id: attachment.id ?? `${attachment.filename ?? "visuel"}-${index}`,
      kind: isVideo ? ("video" as const) : ("image" as const),
      url: attachment.url as string,
      preview,
      filename: attachment.filename ?? "",
      width: typeof attachment.width === "number" ? attachment.width : null,
      height: typeof attachment.height === "number" ? attachment.height : null,
    }
  })

  // Airtable rarely generates a thumbnail for a video, which would leave a black
  // box on the card. Reels ship with a cover image in the same cell — use it as
  // the poster rather than showing nothing.
  const cover = visuals.find((visual) => visual.kind === "image" && visual.preview)?.preview ?? null
  for (const visual of visuals) {
    if (visual.kind === "video" && !visual.preview) visual.preview = cover
  }

  return visuals
}

// Extract the leading numeric prefix from a title like "01 — Lancement" or
// "01 - Lancement" (em dash, en dash or plain hyphen).
function beatNumber(title: string): { key: string; number: number } {
  const match = title.match(/^\s*0*(\d+)/)
  if (!match) return { key: "—", number: Number.MAX_SAFE_INTEGER }
  return { key: match[1], number: Number.parseInt(match[1], 10) }
}

// Opt-in per client (ValidationClient.hideWhenScheduled): a record is hidden
// when its production-status single-select is one of the excluded options.
// Single-select cells come back as the option label string (returnFieldsByFieldId
// keys by ID but doesn't change values); older/other shapes may be an {id,name}
// object — match on either the option ID or the label to cover both.
function isHiddenByStatus(record: AirtableRecord, client: ValidationClient): boolean {
  const cfg = client.hideWhenScheduled
  if (!cfg) return false

  const raw = record.fields[cfg.statusFieldId]
  const value = Array.isArray(raw) ? raw[0] : raw

  let id: string | null = null
  let name = ""
  if (value && typeof value === "object") {
    const obj = value as { id?: unknown; name?: unknown }
    if (typeof obj.id === "string") id = obj.id
    if (typeof obj.name === "string") name = obj.name
  } else {
    name = asString(value)
  }

  return (id != null && cfg.excludeOptionIds.includes(id)) || cfg.excludeOptionNames.includes(name)
}

function mapRecord(record: AirtableRecord, client: ValidationClient): Post {
  const FIELD = client.fields
  const f = record.fields
  return {
    id: record.id,
    title: asString(f[FIELD.title]),
    date: asString(f[FIELD.date]),
    channel: asString(f[FIELD.channel]),
    format: asString(f[FIELD.format]),
    caption: asString(f[FIELD.caption]),
    hashtags: FIELD.hashtags ? asString(f[FIELD.hashtags]) : "",
    link: asString(f[FIELD.link]),
    visuals: mapVisuals(f[FIELD.visuals]),
    approval: toCanonicalApproval(client, asString(f[FIELD.approval])),
    comment: asString(f[FIELD.comment]),
  }
}

function groupIntoBeats(posts: Post[]): Beat[] {
  const beats = new Map<string, Beat>()

  for (const post of posts) {
    const { key, number } = beatNumber(post.title)
    let beat = beats.get(key)
    if (!beat) {
      beat = { key, number, title: post.title, posts: [] }
      beats.set(key, beat)
    }
    beat.posts.push(post)
  }

  const byDate = (a: Post, b: Post) => {
    const ta = Date.parse(a.date)
    const tb = Date.parse(b.date)
    if (Number.isNaN(ta) && Number.isNaN(tb)) return a.date.localeCompare(b.date)
    if (Number.isNaN(ta)) return 1
    if (Number.isNaN(tb)) return -1
    return ta - tb
  }

  for (const beat of beats.values()) {
    beat.posts.sort(byDate)
    // Prefer a beat title from its earliest post (they share the "NN — …" label).
    beat.title = beat.posts[0]?.title || beat.title
  }

  return [...beats.values()].sort((a, b) => a.number - b.number)
}

export async function GET(request: NextRequest) {
  const client = resolveClient(request.nextUrl.searchParams.get("token"))
  if (!client) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const airtableToken = process.env.AIRTABLE_TOKEN
  const { base, table, view } = client

  if (!airtableToken || !base || !table) {
    return NextResponse.json(
      { error: "misconfigured", detail: "AIRTABLE_TOKEN manquant côté serveur." },
      { status: 500 },
    )
  }

  try {
    const records: AirtableRecord[] = []
    let offset: string | undefined

    do {
      const url = new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`)
      if (view) url.searchParams.set("view", view)
      url.searchParams.set("returnFieldsByFieldId", "true")
      if (offset) url.searchParams.set("offset", offset)

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${airtableToken}` },
        cache: "no-store",
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => "")
        return NextResponse.json(
          { error: "airtable", status: res.status, detail: detail.slice(0, 500) },
          { status: 502 },
        )
      }

      const page = (await res.json()) as { records?: AirtableRecord[]; offset?: string }
      records.push(...(page.records ?? []))
      offset = page.offset
    } while (offset)

    const posts = records
      .filter((record) => !isHiddenByStatus(record, client))
      .map((record) => mapRecord(record, client))
    const beats = groupIntoBeats(posts)

    return NextResponse.json({ beats })
  } catch (error) {
    return NextResponse.json(
      { error: "fetch_failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 502 },
    )
  }
}
