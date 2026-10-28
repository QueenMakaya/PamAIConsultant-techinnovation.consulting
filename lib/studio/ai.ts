import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import * as z from "zod/v4"
import type { HostDecision, Lang, PastEpisode, StudioProfile, Turn, WrapUp } from "./types"

// Server-side brain of the host. Each live call must come back fast enough to
// feel like a conversation, so they run at low effort with short outputs; the
// post-episode wrap-up has time and runs higher.

const MODEL = "claude-opus-5-5"

// On a safety decline the API re-runs the request on Anthropic's recommended
// fallback model instead of returning the refusal.
const FALLBACK: { betas: Anthropic.Beta.AnthropicBeta[]; fallbacks: "default" } = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
}

let client: Anthropic | null = null
function getClient(): Anthropic {
  client ??= new Anthropic()
  return client
}

export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

const LANG_NAME: Record<Lang, string> = { fr: "French", en: "English" }

function hostSystem(profile: StudioProfile, lang: Lang): string {
  return `You are "${profile.host.name[lang]}", the host of "${profile.showName[lang]}", a weekly YouTube interview show. The twist: the guest, ${profile.guest.name}, is being interviewed by a stylized avatar of themself, so you are warm, close and a little playful, like the guest's own inner voice that knows when to dig.

About the guest (background only; never recite it, never invent anything beyond it or beyond what the guest says on camera):
${profile.guest.bio.en}

How you speak — everything you write is read aloud by a voice engine:
- One or two short spoken sentences, 35 words at most.
- No lists, no emojis, no stage directions, no quotation marks around your own line.
- Build on something concrete the guest just said: a name, a number, a feeling, a turning point. Ask for the moment, the story, the lesson.
- Write in ${LANG_NAME[lang]}.${lang === "fr" ? ' Address the guest with "tu". Natural, warm international French that sounds right in Montreal.' : ""}
- The guest is new to being on camera. Never judge, never lecture, never push on something the guest avoided or declined.`
}

function memoryBlock(past: PastEpisode[]): string {
  if (past.length === 0) return "No earlier episodes yet."
  return past
    .slice(-5)
    .map((e) => `- ${e.date} · ${e.title}: ${e.summary}`)
    .join("\n")
}

const DecisionSchema = z.object({
  action: z.enum(["follow_up", "move_on"]),
  line: z.string(),
})

export async function decideFollowUp(input: {
  profile: StudioProfile
  lang: Lang
  themeTitle: string
  question: string
  answer: string
  followUpsSoFar: string[]
  followUpsLeft: number
  past: PastEpisode[]
}): Promise<HostDecision> {
  const { profile, lang } = input
  const prompt = `Episode theme: ${input.themeTitle}

Earlier episodes (you may call back to one if it truly connects, at most once per episode):
${memoryBlock(input.past)}

The question you asked:
${input.question}
${input.followUpsSoFar.length ? `\nFollow-ups you already asked on it:\n${input.followUpsSoFar.map((f) => `- ${f}`).join("\n")}\n` : ""}
What the guest answered (live speech-to-text, may contain recognition errors):
${input.answer || "(no words were captured)"}

Decide what you do next. You may ask ${input.followUpsLeft} more follow-up(s) on this question.
- "follow_up": the answer opened a door worth one more step (a story hinted at but not told, a feeling named but not explored, a vague claim that deserves an example). "line" is that single follow-up question.
- "move_on": the answer is complete, the guest signalled they want to move on or stay private, or nothing was captured. "line" is a brief, warm acknowledgement of a few words that does not summarise and does not ask anything — the next question is read right after it.`

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    ...FALLBACK,
    output_config: { effort: "low", format: betaZodOutputFormat(DecisionSchema) },
    system: hostSystem(profile, lang),
    messages: [{ role: "user", content: prompt }],
  })
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("no_decision")
  }
  const decision = response.parsed_output
  if (input.followUpsLeft <= 0) decision.action = "move_on"
  return decision
}

const RephraseSchema = z.object({ line: z.string() })

export async function rephraseQuestion(input: {
  profile: StudioProfile
  lang: Lang
  themeTitle: string
  question: string
}): Promise<string> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    ...FALLBACK,
    output_config: { effort: "low", format: betaZodOutputFormat(RephraseSchema) },
    system: hostSystem(input.profile, input.lang),
    messages: [
      {
        role: "user",
        content: `Episode theme: ${input.themeTitle}

The guest asked you to put this question differently:
${input.question}

Ask the same thing from a simpler, more concrete angle — easier to start answering, for example by asking for one specific moment. "line" is the new question, one sentence.`,
      },
    ],
  })
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("no_rephrase")
  }
  return response.parsed_output.line
}

const WrapUpSchema = z.object({
  titles: z.array(z.string()),
  description: z.string(),
  chapters: z.array(z.object({ turn: z.number(), title: z.string() })),
  shorts: z.array(z.object({ turn: z.number(), quote: z.string(), hook: z.string() })),
  tags: z.array(z.string()),
  thumbnailText: z.string(),
  summary: z.string(),
})

function formatClock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, "0")}`
}

export async function writeWrapUp(input: {
  profile: StudioProfile
  lang: Lang
  themeTitle: string
  turns: Turn[]
}): Promise<WrapUp> {
  const { profile, lang } = input
  const transcript = input.turns
    .map(
      (t, i) =>
        `[turn ${i} · ${formatClock(t.at)} · ${t.kind}]\nHOST: ${t.text}${t.answer ? `\n${profile.guest.name.toUpperCase()}: ${t.answer}` : ""}`,
    )
    .join("\n\n")

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { effort: "medium", format: betaZodOutputFormat(WrapUpSchema) },
    system: `You turn a recorded episode of "${profile.showName[lang]}" into a YouTube publishing pack for its creator, ${profile.guest.name}. The show is a transparent, personal look at the creator's entrepreneurial journey. Write in ${LANG_NAME[lang]}. Stay faithful to what was actually said — never invent facts, numbers or names. The transcript comes from live speech-to-text, so silently fix obvious recognition errors.`,
    messages: [
      {
        role: "user",
        content: `Theme: ${input.themeTitle}

Transcript (each turn is something the host said, followed by the guest's answer):
${transcript}

Produce:
- titles: 3 YouTube title options, under 70 characters, honest and curiosity-driven, no clickbait in caps.
- description: 3 short paragraphs in the creator's voice (first person), then one line inviting viewers to subscribe and comment. No hashtags, no chapter list (chapters are added separately).
- chapters: one per host "opener", "question" or "closing" turn worth a chapter, using its turn number. The first chapter must be turn 0. Titles of 2 to 5 words.
- shorts: 3 to 5 moments that work as standalone vertical clips: the turn number, the guest's strongest quote (verbatim or lightly cleaned), and a one-line on-screen hook.
- tags: 8 to 12 YouTube tags.
- thumbnailText: 2 to 4 punchy words for the thumbnail.
- summary: 2 to 3 sentences of what the guest shared, written as memory notes for the host of future episodes (facts, stories, open threads worth returning to).`,
      },
    ],
  })
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("no_wrapup")
  }
  const out = response.parsed_output
  const last = input.turns.length - 1
  out.chapters = out.chapters.filter((c) => Number.isInteger(c.turn) && c.turn >= 0 && c.turn <= last)
  out.shorts = out.shorts.filter((s) => Number.isInteger(s.turn) && s.turn >= 0 && s.turn <= last)
  return out
}
