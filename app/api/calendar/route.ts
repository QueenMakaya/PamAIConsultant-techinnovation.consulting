import { NextResponse, type NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Airtable field IDs (records are fetched with returnFieldsByFieldId=true).
const FIELD = {
  title: "fldRPvHjX9ttg7Zuq",
  date: "flds3Pqa5NCw0sxUA",
  channel: "fld401OFcLHdxvoGL",
  format: "fldAJC3vX6IfkEv0X",
  caption: "fldXBa4oEgLFoTmX9",
  hashtags: "fldgGjCNn4jUT0jN5",
  link: "fldVHYG9tfW5SOGD4",
  visuals: "fld4P6xUg7dUrwEi8",
  approval: "fldZ8KXT6KpJjZhaU",
  comment: "fldOwvLIfHA3zM1XV",
} as const

type Attachment = {
  url?: string
  filename?: string
  type?: string
  thumbnails?: {
    small?: { url: string }
    large?: { url: string }
    full?: { url: string }
  }
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
  visual: string | null
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

function firstThumbnail(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const first = value[0] as Attachment
  return (
    first?.thumbnails?.large?.url ??
    first?.thumbnails?.full?.url ??
    first?.thumbnails?.small?.url ??
    first?.url ??
    null
  )
}

// Extract the leading numeric prefix from a title like "01 — Lancement".
function beatNumber(title: string): { key: string; number: number } {
  const match = title.match(/^\s*0*(\d+)/)
  if (!match) return { key: "—", number: Number.MAX_SAFE_INTEGER }
  return { key: match[1], number: Number.parseInt(match[1], 10) }
}

function mapRecord(record: AirtableRecord): Post {
  const f = record.fields
  return {
    id: record.id,
    title: asString(f[FIELD.title]),
    date: asString(f[FIELD.date]),
    channel: asString(f[FIELD.channel]),
    format: asString(f[FIELD.format]),
    caption: asString(f[FIELD.caption]),
    hashtags: asString(f[FIELD.hashtags]),
    link: asString(f[FIELD.link]),
    visual: firstThumbnail(f[FIELD.visuals]),
    approval: asString(f[FIELD.approval]),
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
  const token = request.nextUrl.searchParams.get("token")
  if (token !== process.env.VALIDATION_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const airtableToken = process.env.AIRTABLE_TOKEN
  // Base/table IDs are not secret; default to Anny's K "Content Calendar" so
  // only the secrets (AIRTABLE_TOKEN + VALIDATION_TOKEN) must be configured.
  const base = process.env.AIRTABLE_BASE || "appewRVgrp7nb51ky"
  const table = process.env.AIRTABLE_TABLE || "tbldd33ltZe9ran3d"
  const view = process.env.AIRTABLE_VIEW // optional — omit to read the whole table

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

    const posts = records.map(mapRecord)
    const beats = groupIntoBeats(posts)

    return NextResponse.json({ beats })
  } catch (error) {
    return NextResponse.json(
      { error: "fetch_failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 502 },
    )
  }
}
