import { NextResponse, type NextRequest } from "next/server"
import { aiConfigured } from "@/lib/studio/ai"
import { resolveStudio } from "@/lib/studio/profiles"
import type { StudioSession } from "@/lib/studio/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  let body: { token?: unknown }
  try {
    body = (await request.json()) as { token?: unknown }
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }

  const studio = resolveStudio(body.token)
  if (!studio) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const session: StudioSession = {
    profile: studio.profile,
    voice: studio.voiceId ? "cloned" : "browser",
    ai: aiConfigured(),
  }
  return NextResponse.json({ ok: true, session })
}
