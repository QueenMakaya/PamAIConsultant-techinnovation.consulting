import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import * as z from "zod/v4"
import { TECHNIQUE_IDS, craftBlock, type LearnedMove } from "./craft"
import type { Brief, ContentPack, HostDecision, Lang, PastEpisode, StudioProfile, Turn } from "./types"

// Server-side brain of the host. Live calls must come back fast enough to feel
// like a conversation, so they run at low effort with short outputs; planning
// and the post-episode content pack have time and run higher.

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

function guestName(profile: StudioProfile, brief: Brief | null): string {
  return brief?.name?.trim() || profile.guest.name
}

// What the host knows about the guest: the profile bio plus the written brief.
function guestContext(profile: StudioProfile, brief: Brief | null): string {
  const lines = [profile.guest.bio.en && `Background: ${profile.guest.bio.en}`]
  if (brief) {
    const fields: [string, string][] = [
      ["Business", brief.business],
      ["What they sell", brief.offer],
      ["Who they help", brief.audience],
      ["The change they create", brief.transformation],
      ["Proof (a result they're proud of)", brief.proof],
      ["What viewers should do after watching", [brief.cta, brief.link].filter(Boolean).join(" — ")],
    ]
    for (const [label, value] of fields) if (value?.trim()) lines.push(`${label}: ${value.trim()}`)
  }
  return lines.filter(Boolean).join("\n") || "No background given."
}

// Stable for a whole session, so it's sent as a cached block: the live calls
// (follow-ups, nudges) then reuse it instead of re-reading it every time.
function hostSystem(
  profile: StudioProfile,
  brief: Brief | null,
  lang: Lang,
  learned: LearnedMove[] = [],
): Anthropic.Beta.BetaTextBlockParam[] {
  return [{ type: "text", text: hostSystemText(profile, brief, lang, learned), cache_control: { type: "ephemeral" } }]
}

function hostSystemText(profile: StudioProfile, brief: Brief | null, lang: Lang, learned: LearnedMove[]): string {
  const name = guestName(profile, brief)
  return `You are "${profile.host.name[lang]}", the host of "${profile.showName[lang]}", an interview show recorded for YouTube and short-form video. The twist: the guest, ${name}, an entrepreneur, is interviewed by a stylized avatar of themself, so you are warm, close and a little playful, like the guest's own inner voice that knows when to dig.

What you know about the guest (never recite it, never invent anything beyond it or beyond what the guest says on camera):
${guestContext(profile, brief)}

Your job is to draw out stories that make viewers trust the guest and want what they offer — without ever sounding like an advert. Concrete moments, real clients, numbers, feelings and turning points sell; claims and adjectives don't.

How you speak — everything you write is read aloud by a voice engine:
- One or two short spoken sentences, 35 words at most.
- No lists, no emojis, no stage directions, no quotation marks around your own line.
- Build on something concrete the guest just said: a name, a number, a feeling, a turning point. Ask for the moment, the story, the lesson.
- Write in ${LANG_NAME[lang]}.${lang === "fr" ? ' Address the guest with "tu". Natural, warm international French that sounds right in Montreal.' : ""}
- The guest may be new to being on camera. Never judge, never lecture, never push on something the guest avoided or declined.

${craftBlock(learned)}`
}

function memoryBlock(past: PastEpisode[]): string {
  if (past.length === 0) return "No earlier episodes yet."
  return past
    .slice(-5)
    .map((e) => `- ${e.date} · ${e.title}: ${e.summary}`)
    .join("\n")
}

// ---- Planning ---------------------------------------------------------------

const PlanSchema = z.object({
  title: z.object({ fr: z.string(), en: z.string() }),
  questions: z.array(z.object({ fr: z.string(), en: z.string() })),
})

export async function planEpisode(input: {
  profile: StudioProfile
  brief: Brief | null
  lang: Lang
  topicTitle: string
  intent: string
  note: string
  past: PastEpisode[]
  learned: LearnedMove[]
}): Promise<{ title: { fr: string; en: string }; questions: { fr: string; en: string }[] }> {
  const { profile, brief, lang } = input
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    ...FALLBACK,
    output_config: { effort: "medium", format: betaZodOutputFormat(PlanSchema) },
    system: hostSystem(profile, brief, lang, input.learned),
    messages: [
      {
        role: "user",
        content: `Plan today's episode.

Topic: ${input.topicTitle}
What this episode is for: ${input.intent}
${input.note.trim() ? `What the guest wants to talk about today, in their words: ${input.note.trim()}\n` : ""}
Earlier episodes (avoid repeating them; build on open threads):
${memoryBlock(input.past)}

Write 6 interview questions in the order you'll ask them:
1. An opener that gets the guest talking easily and could become a scroll-stopping first line of a clip.
2-5. The heart: the story, the people they help, the offer shown through a real moment or client, proof.
6. A forward-looking question that lets the guest naturally say what viewers should do next.
Each question is one spoken sentence, specific to this guest and business — never generic interview filler. Give every question in both French (with "tu") and English, with the same meaning. Also give a short episode title (under 60 characters) in both languages.`,
      },
    ],
  })
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error("no_plan")
  const plan = response.parsed_output
  plan.questions = plan.questions.filter((q) => q.fr.trim() && q.en.trim()).slice(0, 8)
  if (plan.questions.length === 0) throw new Error("no_plan")
  return plan
}

// ---- Live: follow-ups and rephrasing ------------------------------------------

const DecisionSchema = z.object({
  action: z.enum(["follow_up", "move_on"]),
  technique: z.enum(TECHNIQUE_IDS),
  line: z.string(),
})

export async function decideFollowUp(input: {
  profile: StudioProfile
  brief: Brief | null
  lang: Lang
  themeTitle: string
  question: string
  answer: string
  followUpsSoFar: string[]
  followUpsLeft: number
  past: PastEpisode[]
  learned: LearnedMove[]
}): Promise<HostDecision> {
  const { profile, brief, lang } = input
  const prompt = `Episode theme: ${input.themeTitle}

Earlier episodes (you may call back to one if it truly connects, at most once per episode):
${memoryBlock(input.past)}

The question you asked:
${input.question}
${input.followUpsSoFar.length ? `\nFollow-ups you already asked on it:\n${input.followUpsSoFar.map((f) => `- ${f}`).join("\n")}\n` : ""}
What the guest answered (live speech-to-text, may contain recognition errors):
${input.answer || "(no words were captured)"}

Decide what you do next. You may ask ${input.followUpsLeft} more follow-up(s) on this question.
- "follow_up": the answer opened a door worth one more step (a story hinted at but not told, a client mentioned but not described, a feeling named but not explored, a vague claim that deserves an example or a number). "line" is that single follow-up question.
- "move_on": the answer is complete, the guest signalled they want to move on or stay private, or nothing was captured. "line" is a brief, warm acknowledgement of a few words that does not summarise and does not ask anything — the next question is read right after it.
"technique" is the playbook technique your line uses (use "affirm" for a move-on acknowledgement).`

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    ...FALLBACK,
    output_config: { effort: "low", format: betaZodOutputFormat(DecisionSchema) },
    system: hostSystem(profile, brief, lang, input.learned),
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
  brief: Brief | null
  lang: Lang
  themeTitle: string
  question: string
  learned: LearnedMove[]
}): Promise<string> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    ...FALLBACK,
    output_config: { effort: "low", format: betaZodOutputFormat(RephraseSchema) },
    system: hostSystem(input.profile, input.brief, input.lang, input.learned),
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

// ---- Live: the guest went quiet --------------------------------------------

const NudgeSchema = z.object({ technique: z.enum(TECHNIQUE_IDS), line: z.string() })

export async function nudgeGuest(input: {
  profile: StudioProfile
  brief: Brief | null
  lang: Lang
  themeTitle: string
  question: string
  answer: string
  kind: "start" | "mid"
  learned: LearnedMove[]
}): Promise<{ technique: string; line: string }> {
  const situation =
    input.kind === "start"
      ? `The guest has been silent for several seconds without starting to answer. They may be frozen, searching or intimidated. Offer an easy way in (usually "easy_entry" or "one_moment") — warm, low-pressure, never the original question repeated.`
      : `The guest started answering, then went quiet for several seconds without signalling they were done. Help them continue the thread they opened (usually "mirror", "say_more", "label" or "specifics"), based on their last words. Keep it very short — a mirror can be two or three words.`
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 1500,
    ...FALLBACK,
    output_config: { effort: "low", format: betaZodOutputFormat(NudgeSchema) },
    system: hostSystem(input.profile, input.brief, input.lang, input.learned),
    messages: [
      {
        role: "user",
        content: `Episode theme: ${input.themeTitle}

The question on the table:
${input.question}

What the guest has said so far (live speech-to-text):
${input.answer || "(nothing yet)"}

${situation}
"line" is what you say, one short spoken sentence at most. "technique" is the playbook technique it uses.`,
      },
    ],
  })
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error("no_nudge")
  return response.parsed_output
}

// ---- Learning from interviews the guest admires --------------------------------

const LearnSchema = z.object({
  moves: z.array(z.object({ name: z.string(), when: z.string(), how: z.string(), example: z.string() })),
})

export async function learnFromInterview(input: { transcript: string; lang: Lang }): Promise<LearnedMove[]> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    ...FALLBACK,
    output_config: { effort: "medium", format: betaZodOutputFormat(LearnSchema) },
    system: `You study how great interviewers work. From an interview transcript, you extract the reusable moves the interviewer makes — how they open, follow up, handle silence or vague answers, go deeper, and close — so another host can apply them to entrepreneurs. Write in ${LANG_NAME[input.lang]}.`,
    messages: [
      {
        role: "user",
        content: `Transcript of an interview the guest admires:

${input.transcript}

Extract 3 to 8 distinct interviewer moves that would help someone interview an entrepreneur about their business. For each: "name" (2 to 5 words), "when" to use it, "how" to do it, and "example" — a new example line in your own words for an entrepreneur interview. Never copy more than a few words from the transcript; describe the technique, don't reproduce the interview. Skip moves that are just ordinary questions.`,
      },
    ],
  })
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error("no_moves")
  return response.parsed_output.moves.slice(0, 8)
}

// ---- After the episode: posts that sell --------------------------------------

const ContentSchema = z.object({
  clips: z.array(
    z.object({
      turn: z.number(),
      hook: z.string(),
      onScreenText: z.string(),
      caption: z.string(),
      hashtags: z.array(z.string()),
    }),
  ),
  linkedin: z.string(),
  instagram: z.object({ caption: z.string(), carousel: z.array(z.string()) }),
  youtube: z.object({
    titles: z.array(z.string()),
    description: z.string(),
    chapters: z.array(z.object({ turn: z.number(), title: z.string() })),
    tags: z.array(z.string()),
    thumbnailText: z.string(),
  }),
  summary: z.string(),
})

function formatClock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, "0")}`
}

export async function writeContent(input: {
  profile: StudioProfile
  brief: Brief | null
  lang: Lang
  themeTitle: string
  turns: Turn[]
}): Promise<ContentPack> {
  const { profile, brief, lang } = input
  const name = guestName(profile, brief)
  const transcript = input.turns
    .map(
      (t, i) =>
        `[turn ${i} · ${formatClock(t.at)} · ${t.kind}]\nHOST: ${t.text}${t.answer ? `\n${name.toUpperCase()}: ${t.answer}` : ""}`,
    )
    .join("\n\n")

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { effort: "high", format: betaZodOutputFormat(ContentSchema) },
    system: `You are a short-form content strategist for entrepreneurs. You turn a recorded interview of ${name} into posts that stop the scroll, build trust and sell — in the creator's own voice, first person, in ${LANG_NAME[lang]}.

About the creator:
${guestContext(profile, brief)}

Rules you never break:
- Stay faithful to what was actually said. Never invent facts, numbers, clients or results. The transcript comes from live speech-to-text, so silently fix obvious recognition errors.
- Every piece follows hook → story → value → soft call to action. The hook names the viewer or their problem, or opens a loop, in the very first line.
- Sell through stories and proof, never through hype. No clickbait in capitals, no fake urgency, no emoji walls.
- The call to action points to what the creator wants viewers to do${brief?.cta ? ` (${brief.cta}${brief.link ? ` — ${brief.link}` : ""})` : ""}.`,
    messages: [
      {
        role: "user",
        content: `Episode theme: ${input.themeTitle}

Transcript (each turn is something the host said, followed by the creator's answer):
${transcript}

Produce:
- clips: the 3 to 5 strongest moments to cut as vertical clips (Reels, TikTok, Shorts). Use the turn number whose answer holds the moment; favour answers whose first sentence already works as a hook. For each: "hook" — the first line spoken or shown, under 12 words; "onScreenText" — 3 to 7 words of text overlay for the first 3 seconds; "caption" — 2 to 4 short lines ending with the call to action; "hashtags" — 3 to 5, without the # sign.
- linkedin: one post of 150 to 250 words. A one-line hook, short paragraphs, one concrete story from the interview, the lesson, a soft call to action. At most 3 hashtags at the end.
- instagram: "caption" for the episode (hook line, 3 to 5 short lines, call to action), and "carousel" — 5 to 7 slide texts, slide 1 a hook, the last slide the call to action, each under 25 words.
- youtube: 3 "titles" under 70 characters; a "description" of 3 short paragraphs plus one call-to-action line (no chapter list, no hashtags); "chapters" — one per host "opener", "question" or "closing" turn worth a chapter, using its turn number, the first being turn 0, titles of 2 to 5 words; 8 to 12 "tags"; "thumbnailText" of 2 to 4 punchy words.
- summary: 2 to 3 sentences of what the creator shared, written as memory notes for the host of future episodes (facts, stories, open threads worth returning to).`,
      },
    ],
  })
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("no_content")
  }
  const out = response.parsed_output
  const last = input.turns.length - 1
  const valid = (turn: number) => Number.isInteger(turn) && turn >= 0 && turn <= last
  out.clips = out.clips.filter((c) => valid(c.turn))
  out.youtube.chapters = out.youtube.chapters.filter((c) => valid(c.turn))
  return out
}
