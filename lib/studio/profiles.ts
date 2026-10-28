import { pamProfile } from "./pam"
import type { StudioProfile } from "./types"

// Token-gated studios, same pattern as lib/validation-clients.ts: the token in
// the URL picks the profile, and tokens live only in env vars (this repo is
// public). Selling the studio to a client = add a profile + its env vars.

type StudioDef = {
  profile: StudioProfile
  tokenEnv: string
  // ElevenLabs voice for the host. Without it the page falls back to the
  // browser's built-in voice (fine for practice, not captured in recordings).
  voiceIdEnv: string
}

const STUDIOS: StudioDef[] = [{ profile: pamProfile, tokenEnv: "STUDIO_TOKEN", voiceIdEnv: "STUDIO_VOICE_ID" }]

export type ResolvedStudio = { profile: StudioProfile; voiceId: string | null }

export function resolveStudio(token: unknown): ResolvedStudio | null {
  if (typeof token !== "string" || token.length === 0) return null
  for (const studio of STUDIOS) {
    const expected = process.env[studio.tokenEnv]
    if (expected && token === expected) {
      const voiceId = process.env[studio.voiceIdEnv]
      return {
        profile: studio.profile,
        voiceId: voiceId && process.env.ELEVENLABS_API_KEY ? voiceId : null,
      }
    }
  }
  return null
}
