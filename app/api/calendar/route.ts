import { NextResponse, type NextRequest } from "next/server"
import { AirtableError } from "@/lib/content-ops/airtable"
import { groupIntoBeats, loadCalendar, toPortalPost } from "@/lib/content-ops/posts"
import { resolveBusinessByToken } from "@/lib/content-ops/registry"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export type { Beat, Post, Visual } from "@/lib/content-ops/posts"

export async function GET(request: NextRequest) {
  try {
    const business = await resolveBusinessByToken(request.nextUrl.searchParams.get("token"))
    if (!business) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const { posts } = await loadCalendar(business)
    const beats = groupIntoBeats(posts.filter((p) => p.visibleInPortal).map(toPortalPost))
    return NextResponse.json({ business: business.name, beats })
  } catch (error) {
    if (error instanceof AirtableError) {
      return NextResponse.json(
        { error: error.status === 500 ? "misconfigured" : "airtable", status: error.status, detail: error.detail },
        { status: error.status === 500 ? 500 : 502 },
      )
    }
    return NextResponse.json(
      { error: "fetch_failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 502 },
    )
  }
}
