import { NextResponse, type NextRequest } from "next/server"
import { resolveStudio } from "@/lib/studio/profiles"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Speaks one host line with the studio's ElevenLabs voice (e.g. a clone of the
// guest's own voice). Returned as MP3 so the page can mix it into the recording.
export async function POST(request: NextRequest) {
  let body: { token?: unknown; text?: unknown }
  try {
    body = (await request.json()) as { token?: unknown; text?: unknown }
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }

  const studio = resolveStudio(body.token)
  if (!studio) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!studio.voiceId || !apiKey) {
    return NextResponse.json({ ok: false, error: "voice_not_configured" }, { status: 503 })
  }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 1000) : ""
  if (!text) {
    return NextResponse.json({ ok: false, error: "missing_text" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(studio.voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
        cache: "no-store",
        body: JSON.stringify({
          text,
          model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
          voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.2 },
        }),
      },
    )
    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      return NextResponse.json(
        { ok: false, error: "elevenlabs", status: res.status, detail: detail.slice(0, 300) },
        { status: 502 },
      )
    }
    return new NextResponse(await res.arrayBuffer(), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "fetch_failed" },
      { status: 502 },
    )
  }
}
