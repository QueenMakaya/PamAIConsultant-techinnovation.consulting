import { NextResponse, type NextRequest } from "next/server"
import { aiConfigured, decideFollowUp, learnFromInterview, nudgeGuest, planEpisode, rephraseQuestion, writeContent } from "@/lib/studio/ai"
import type { LearnedMove } from "@/lib/studio/craft"
import { resolveStudio } from "@/lib/studio/profiles"
import type { Brief, Lang, PastEpisode, Turn } from "@/lib/studio/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

type HostBody = {
  token?: unknown
  action?: unknown
  lang?: unknown
  themeTitle?: unknown
  intent?: unknown
  note?: unknown
  question?: unknown
  answer?: unknown
  followUpsSoFar?: unknown
  followUpsLeft?: unknown
  past?: unknown
  turns?: unknown
  brief?: unknown
  learned?: unknown
  kind?: unknown
  transcript?: unknown
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

function learnedList(v: unknown): LearnedMove[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((m): m is LearnedMove => !!m && typeof m === "object" && typeof (m as LearnedMove).name === "string")
    .slice(0, 20)
    .map((m) => ({ name: str(m.name, 80), when: str(m.when, 300), how: str(m.how, 400), example: str(m.example, 300) }))
}

function briefOf(v: unknown): Brief | null {
  if (!v || typeof v !== "object") return null
  const b = v as Record<string, unknown>
  return {
    name: str(b.name, 120),
    business: str(b.business, 300),
    offer: str(b.offer, 600),
    audience: str(b.audience, 600),
    transformation: str(b.transformation, 600),
    proof: str(b.proof, 600),
    cta: str(b.cta, 300),
    link: str(b.link, 300),
    lang: b.lang === "en" || b.lang === "mix" ? b.lang : "fr",
  }
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
  const brief = briefOf(body.brief)
  const learned = learnedList(body.learned)
  const { profile } = studio

  try {
    switch (body.action) {
      case "plan": {
        const plan = await planEpisode({
          profile,
          brief,
          lang,
          topicTitle: themeTitle,
          intent: str(body.intent, 600),
          note: str(body.note, 2000),
          past: pastList(body.past),
          learned,
        })
        return NextResponse.json({ ok: true, plan })
      }
      case "followup": {
        const decision = await decideFollowUp({
          profile,
          brief,
          lang,
          themeTitle,
          question: str(body.question, 2000),
          answer: str(body.answer),
          followUpsSoFar: strList(body.followUpsSoFar),
          followUpsLeft: typeof body.followUpsLeft === "number" ? Math.max(0, Math.min(3, body.followUpsLeft)) : 0,
          past: pastList(body.past),
          learned,
        })
        return NextResponse.json({ ok: true, decision })
      }
      case "rephrase": {
        const line = await rephraseQuestion({ profile, brief, lang, themeTitle, question: str(body.question, 2000), learned })
        return NextResponse.json({ ok: true, line })
      }
      case "nudge": {
        const nudge = await nudgeGuest({
          profile,
          brief,
          lang,
          themeTitle,
          question: str(body.question, 2000),
          answer: str(body.answer),
          kind: body.kind === "mid" ? "mid" : "start",
          learned,
        })
        return NextResponse.json({ ok: true, nudge })
      }
      case "learn": {
        const transcript = str(body.transcript, 120000).trim()
        if (transcript.length < 400) {
          return NextResponse.json({ ok: false, error: "transcript_too_short" }, { status: 400 })
        }
        const moves = await learnFromInterview({ transcript, lang })
        return NextResponse.json({ ok: true, moves })
      }
      case "content": {
        const turns = turnList(body.turns)
        if (turns.length === 0) {
          return NextResponse.json({ ok: false, error: "empty_episode" }, { status: 400 })
        }
        const content = await writeContent({ profile, brief, lang, themeTitle, turns })
        return NextResponse.json({ ok: true, content })
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
