import { NextResponse, type NextRequest } from "next/server"
import { isAdmin } from "@/lib/content-ops/auth"
import { emailConfigured } from "@/lib/content-ops/notify"
import { buildOverview } from "@/lib/content-ops/overview"
import { siteOrigin } from "@/lib/content-ops/registry"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  try {
    // "Actualiser" asks for a straight read from Airtable; a page load takes the
    // cached copy (see lib/content-ops/airtable.ts).
    const fresh = request.nextUrl.searchParams.get("fresh") === "1"
    const overview = await buildOverview(siteOrigin(request.nextUrl.origin), { fresh })
    return NextResponse.json({
      ...overview,
      email: emailConfigured(),
      registryUrl: "https://airtable.com/appd1aIODMuFi1tWO/tbletjExi0LOwhLZe",
      templateUrl: "https://airtable.com/appXoH0aRrW85c83e",
    })
  } catch (error) {
    return NextResponse.json(
      { error: "overview_failed", detail: error instanceof Error ? error.message : "unknown" },
      { status: 502 },
    )
  }
}
