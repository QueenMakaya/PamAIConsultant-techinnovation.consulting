import { NextResponse, type NextRequest } from "next/server"
import { FALLBACK, MODEL, getClient } from "@/lib/studio/ai"

// TEMPORARY diagnostic endpoint — reports presence/length only, never secret
// values. Remove after verifying env configuration.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ?selftest=1 makes one tiny real call to Claude and to ElevenLabs and reports
// only the HTTP status and the provider's error code — never key values.
async function selfTest() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? ""
  const elevenKey = process.env.ELEVENLABS_API_KEY ?? ""
  const voiceId = process.env.STUDIO_VOICE_ID?.trim() ?? ""

  const claude: Record<string, unknown> = {
    keyLooksRight: anthropicKey.trim().startsWith("sk-ant-"),
    keyHadSpaces: anthropicKey !== anthropicKey.trim(),
    workspaceIdPresent: !!process.env.ANTHROPIC_WORKSPACE_ID?.trim(),
  }
  try {
    const res = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 16,
      ...FALLBACK,
      messages: [{ role: "user", content: "Reply with: OK" }],
    })
    claude.ok = true
    claude.model = res.model
  } catch (error) {
    const e = error as { status?: number; error?: { error?: { type?: string; message?: string } }; message?: string }
    claude.ok = false
    claude.status = e.status ?? null
    claude.type = e.error?.error?.type ?? null
    claude.message = (e.error?.error?.message ?? e.message ?? "").slice(0, 200)
  }

  const eleven: Record<string, unknown> = {
    keyHadSpaces: elevenKey !== elevenKey.trim(),
    voiceIdLength: voiceId.length,
  }
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_22050_32`, {
      method: "POST",
      headers: { "xi-api-key": elevenKey.trim(), "Content-Type": "application/json", Accept: "audio/mpeg" },
      cache: "no-store",
      body: JSON.stringify({ text: "Hi", model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2" }),
    })
    eleven.ok = res.ok
    eleven.status = res.status
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { detail?: { status?: string; message?: string } | string } | null
      const detail = body?.detail
      eleven.code = typeof detail === "object" ? (detail?.status ?? null) : null
      eleven.message = (typeof detail === "object" ? (detail?.message ?? "") : (detail ?? "")).slice(0, 200)
    }
  } catch (error) {
    eleven.ok = false
    eleven.message = error instanceof Error ? error.message : "fetch_failed"
  }
  return { claude, elevenlabs: eleven }
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("selftest") === "1") {
    return NextResponse.json(await selfTest())
  }
  const probe = request.nextUrl.searchParams.get("probe") ?? ""
  const v = process.env.VALIDATION_TOKEN

  // Names only (never values) of any token/airtable/validation-related keys —
  // reveals scope issues or key-name typos without exposing secrets.
  const allKeys = Object.keys(process.env)
  const relevantKeys = allKeys.filter((k) => /token|airtable|validation|studio|anthropic|elevenlabs/i.test(k)).sort()

  return NextResponse.json({
    relevantKeys,
    totalEnvKeys: allKeys.length,
    validationToken: {
      present: typeof v === "string" && v.length > 0,
      length: typeof v === "string" ? v.length : 0,
      matchesProbe: v === probe,
      probeLength: probe.length,
    },
    studio: {
      tokenPresent: !!process.env.STUDIO_TOKEN?.trim(),
      anthropicKeyPresent: !!process.env.ANTHROPIC_API_KEY,
      elevenLabsKeyPresent: !!process.env.ELEVENLABS_API_KEY,
      voiceIdPresent: !!process.env.STUDIO_VOICE_ID,
    },
    airtable: {
      tokenPresent: !!process.env.AIRTABLE_TOKEN,
      basePresent: !!process.env.AIRTABLE_BASE,
      tablePresent: !!process.env.AIRTABLE_TABLE,
      viewPresent: !!process.env.AIRTABLE_VIEW,
    },
  })
}
