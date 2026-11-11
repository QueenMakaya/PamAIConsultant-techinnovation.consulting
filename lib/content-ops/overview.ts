// Cross-business snapshot used by the admin dashboard and the daily automation.

import { loadCalendar, summarize, type ClassifiedPost, type Summary } from "./posts"
import { loadBusinesses, portalUrl, type Business } from "./registry"
import { todayInMontreal } from "./standard"

export type PostRef = {
  id: string
  title: string
  date: string
  channel: string
  comment: string
  airtableUrl: string
}

export type BusinessOverview = {
  slug: string
  name: string
  kind: Business["kind"]
  approverName: string
  approverEmail: string
  reminders: boolean
  metricoolBrand: string
  portalUrl: string | null
  airtableUrl: string
  summary: Summary | null
  error: string | null
  toFix: PostRef[]
  approvedToSchedule: PostRef[]
  awaiting: PostRef[]
  overdue: PostRef[]
}

function ref(business: Business, post: ClassifiedPost): PostRef {
  return {
    id: post.id,
    title: post.title,
    date: post.date.slice(0, 10),
    channel: post.channel,
    comment: post.comment,
    airtableUrl: `https://airtable.com/${business.base}/${business.table}/${post.id}`,
  }
}

const byDate = (a: PostRef, b: PostRef) => (a.date || "9999").localeCompare(b.date || "9999")

export async function buildOverview(origin: string): Promise<{
  today: string
  source: "registry" | "legacy"
  businesses: BusinessOverview[]
}> {
  const { businesses, source } = await loadBusinesses()
  const today = todayInMontreal()
  const active = businesses.filter((b) => b.active)

  const rows = await Promise.all(
    active.map(async (business): Promise<BusinessOverview> => {
      const base: BusinessOverview = {
        slug: business.slug,
        name: business.name,
        kind: business.kind,
        approverName: business.approverName,
        approverEmail: business.approverEmail,
        reminders: business.reminders,
        metricoolBrand: business.metricoolBrand,
        portalUrl: portalUrl(business, origin),
        airtableUrl: `https://airtable.com/${business.base}/${business.table}`,
        summary: null,
        error: null,
        toFix: [],
        approvedToSchedule: [],
        awaiting: [],
        overdue: [],
      }
      try {
        const { posts } = await loadCalendar(business)
        const inPortal = posts.filter((p) => p.visibleInPortal)
        return {
          ...base,
          summary: summarize(posts, today),
          toFix: inPortal.filter((p) => p.decision === "adjust").map((p) => ref(business, p)).sort(byDate),
          approvedToSchedule: inPortal
            .filter((p) => p.decision === "approved")
            .map((p) => ref(business, p))
            .sort(byDate),
          awaiting: inPortal.filter((p) => p.decision === "pending").map((p) => ref(business, p)).sort(byDate),
          overdue: posts.filter((p) => p.overdue).map((p) => ref(business, p)).sort(byDate),
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : "unknown"
        return { ...base, error: detail }
      }
    }),
  )

  return { today, source, businesses: rows }
}
