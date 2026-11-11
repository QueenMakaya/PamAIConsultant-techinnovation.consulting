// Reading a business's calendar into normalised posts, whatever the base's own
// field names and option spellings are.

import { asString, listRecords, type AirtableRecord } from "./airtable"
import type { Business } from "./registry"
import {
  FIELD_ALIASES,
  HIDDEN_STAGES,
  canonicalApproval,
  toDecision,
  toStage,
  todayInMontreal,
  type Decision,
  type FieldKey,
  type ProductionStage,
} from "./standard"

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

// A post plus the normalised workflow state used by the admin and automations.
export type ClassifiedPost = Post & {
  stage: ProductionStage
  decision: Decision
  visibleInPortal: boolean
  overdue: boolean
}

export type Beat = {
  key: string
  number: number
  title: string
  posts: Post[]
}

export type FieldMap = Record<FieldKey, string>

// Field name for each key: registry override, else the first alias seen in the
// records (empty cells are omitted by Airtable, so we look across all rows),
// else the standard name.
export function resolveFields(business: Business, records: AirtableRecord[]): FieldMap {
  const seen = new Set<string>()
  for (const record of records) for (const name of Object.keys(record.fields)) seen.add(name)
  const map = {} as FieldMap
  for (const key of Object.keys(FIELD_ALIASES) as FieldKey[]) {
    const aliases = FIELD_ALIASES[key]
    map[key] = business.fieldOverrides[key] ?? aliases.find((name) => seen.has(name)) ?? aliases[0]
  }
  return map
}

type Attachment = {
  id?: string
  url?: string
  filename?: string
  type?: string
  width?: number
  height?: number
  thumbnails?: { small?: { url: string }; large?: { url: string }; full?: { url: string } }
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

function classify(record: AirtableRecord, business: Business, fields: FieldMap, today: string): ClassifiedPost {
  const f = record.fields
  const rawApproval = asString(f[fields.approval])
  const stage = toStage(asString(f[fields.status]))
  const decision = toDecision(rawApproval)
  const date = asString(f[fields.date])
  const day = date.slice(0, 10)
  const done = HIDDEN_STAGES.includes(stage)
  const overdue = /^\d{4}-\d{2}-\d{2}$/.test(day) && day < today && !done
  return {
    id: record.id,
    title: asString(f[fields.title]),
    date,
    channel: asString(f[fields.channel]),
    format: asString(f[fields.format]),
    caption: asString(f[fields.caption]),
    hashtags: asString(f[fields.hashtags]),
    link: asString(f[fields.link]),
    visuals: mapVisuals(f[fields.visuals]),
    approval: canonicalApproval(rawApproval),
    comment: asString(f[fields.comment]),
    stage,
    decision,
    overdue,
    // Standard rule for every business: scheduled / published / cancelled
    // posts leave the validation view; overdue ones too when opted in.
    visibleInPortal: !done && !(business.hideOverdue && overdue),
  }
}

export async function loadCalendar(business: Business): Promise<{ posts: ClassifiedPost[]; fields: FieldMap }> {
  const records = await listRecords(business.base, business.table, { view: business.view })
  const fields = resolveFields(business, records)
  const today = todayInMontreal()
  return { posts: records.map((r) => classify(r, business, fields, today)), fields }
}

export function toPortalPost(post: ClassifiedPost): Post {
  const { stage: _s, decision: _d, visibleInPortal: _v, overdue: _o, ...rest } = post
  return rest
}

// Extract the leading numeric prefix from a title like "01 — Lancement".
function beatNumber(title: string): { key: string; number: number } {
  const match = title.match(/^\s*0*(\d+)/)
  if (!match) return { key: "—", number: Number.MAX_SAFE_INTEGER }
  return { key: match[1], number: Number.parseInt(match[1], 10) }
}

export function groupIntoBeats(posts: Post[]): Beat[] {
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

// ---- Workflow summary (admin dashboard + automations) -----------------------

export type Summary = {
  awaiting: number // in the portal, no decision yet
  toFix: number // client asked for changes
  approvedToSchedule: number // approved but not scheduled / published yet
  scheduled: number
  published: number
  overdue: number // date passed, not scheduled / published / cancelled
  dueSoon: number // awaiting a decision and due within the next 3 days
  nextDate: string | null // earliest upcoming post date still in the pipeline
}

export function summarize(posts: ClassifiedPost[], today = todayInMontreal()): Summary {
  const soon = new Date(`${today}T12:00:00Z`)
  soon.setUTCDate(soon.getUTCDate() + 3)
  const soonDay = soon.toISOString().slice(0, 10)
  const s: Summary = {
    awaiting: 0, toFix: 0, approvedToSchedule: 0, scheduled: 0,
    published: 0, overdue: 0, dueSoon: 0, nextDate: null,
  }
  for (const p of posts) {
    const day = p.date.slice(0, 10)
    if (p.stage === "published") s.published++
    else if (p.stage === "scheduled") s.scheduled++
    if (p.overdue) s.overdue++
    if (!p.visibleInPortal) continue
    if (p.decision === "adjust") s.toFix++
    else if (p.decision === "approved") s.approvedToSchedule++
    else if (p.decision === "pending") {
      s.awaiting++
      if (day && day >= today && day <= soonDay) s.dueSoon++
    }
    if (day && day >= today && (!s.nextDate || day < s.nextDate)) s.nextDate = day
  }
  return s
}
