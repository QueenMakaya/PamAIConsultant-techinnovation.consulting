import { NextResponse, type NextRequest } from "next/server"

// TEMPORARY diagnostic endpoint — reports presence/length only, never secret
// values. Remove after verifying env configuration.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
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
