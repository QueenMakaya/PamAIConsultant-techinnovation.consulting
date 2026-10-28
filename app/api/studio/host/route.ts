import { NextResponse, type NextRequest } from "next/server"
import { aiConfigured, decideFollowUp, rephraseQuestion, writeWrapUp } from "@/lib/studio/ai"
import { resolveStudio } from "@/lib/studio/profiles"
import type { Lang, PastEpisode, Turn } from "@/lib/studio/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

type HostBody = {
  token?: unknown
  action?: unknown
  lang?: unknown
  themeTitle?: unknown
  question?: unknown
  answer?: unknown
  followUpsSoFar?: unknown
  followUpsLeft?: unknown
  past?: unknown
  turns?: unknown
}

const str = (v: unknown, max = 20000) => (typeof v === "string" ? v.slice(0, max) : "")
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 10) : [])

function pastList(v: unknown): PastEpisode[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((e): e is PastEpisode => !!e && typeof e === "object" && typeof (e as PastEpisode).summary === "string")
    .slice(-5)
    .map((e) => ({ ...e, title: str(e.title, 200), summary: str(e.summary, 1500) }))
}

function turnList(v: unknown): Turn[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((t): t is Turn => !!t && typeof t === "object" && typeof (t as Turn).text === "string")
    .slice(0, 200)
    .map((t) => ({
      ...t,
      text: str(t.text, 2000),
      answer: str(t.answer, 20000),
      at: typeof t.at === "number" ? t.at : 0,
      segments: [],
    }))
}

export async function POST(request: NextRequest) {
  let body: HostBody
  try {
    body = (await request.json()) as HostBody
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }

  const studio = resolveStudio(body.token)
  if (!studio) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  if (!aiConfigured()) {
    return NextResponse.json({ ok: false, error: "ai_not_configured" }, { status: 503 })
  }

  const lang: Lang = body.lang === "en" ? "en" : "fr"
  const themeTitle = str(body.themeTitle, 200)
  const { profile } = studio

  try {
    switch (body.action) {
      case "followup": {
        const decision = await decideFollowUp({
          profile,
          lang,
          themeTitle,
          question: str(body.question, 2000),
          answer: str(body.answer),
          followUpsSoFar: strList(body.followUpsSoFar),
          followUpsLeft: typeof body.followUpsLeft === "number" ? Math.max(0, Math.min(3, body.followUpsLeft)) : 0,
          past: pastList(body.past),
        })
        return NextResponse.json({ ok: true, decision })
      }
      case "rephrase": {
        const line = await rephraseQuestion({ profile, lang, themeTitle, question: str(body.question, 2000) })
        return NextResponse.json({ ok: true, line })
      }
      case "wrapup": {
        const turns = turnList(body.turns)
        if (turns.length === 0) {
          return NextResponse.json({ ok: false, error: "empty_episode" }, { status: 400 })
        }
        const wrapUp = await writeWrapUp({ profile, lang, themeTitle, turns })
        return NextResponse.json({ ok: true, wrapUp })
      }
      default:
        return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "host_failed" },
      { status: 502 },
    )
  }
}
