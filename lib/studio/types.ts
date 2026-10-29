// Shared shapes for the /studio interview tool — imported by both the page and
// the /api/studio/* routes, so keep this file free of server-only code.

export type Lang = "fr" | "en"
// "mix" alternates languages question by question.
export type EpisodeLang = Lang | "mix"

export type Bilingual = { fr: string; en: string }

// Vertical is for Reels / TikTok / Shorts, horizontal for YouTube.
export type Format = "vertical" | "horizontal"

export type Question = {
  id: string
  text: Bilingual
  // "deep" questions touch personal ground; the plan screen flags them so the
  // guest can leave them out until they're ready.
  depth?: "light" | "deep"
}

export type Theme = {
  id: string
  title: Bilingual
  blurb: Bilingual
  questions: Question[]
}

export type HairStyle = "afro" | "puff" | "braids" | "short" | "wrap"

// How AVA appears: the brand orb, the guest's own photo, or the drawn illustration.
export type AvatarStyle = "orb" | "photo" | "illustration"

export type AvatarLook = {
  skin: string
  hair: string
  hairStyle: HairStyle
  outfit: string
  accent: string
  glasses: boolean
  earrings: boolean
}

export type StudioProfile = {
  slug: string
  showName: Bilingual
  tagline: Bilingual
  guest: { name: string; bio: Bilingual }
  host: { name: Bilingual; avatar: AvatarLook }
  // The guest's own recurring series, offered next to the generic topics.
  themes: Theme[]
  // Asked last in every episode unless the guest removes it.
  closingQuestion: Bilingual
}

// What /api/studio/session hands the page once the token checks out.
export type StudioSession = {
  profile: StudioProfile
  voice: "cloned" | "browser"
  ai: boolean
}

// The written intake the guest fills once: it steers every interview and every
// post towards their business and what they sell.
export type Brief = {
  name: string
  business: string
  offer: string
  audience: string
  transformation: string
  proof: string
  cta: string
  link: string
  lang: EpisodeLang
}

export type PlanQuestion = { id: string; text: Bilingual; kind: "question" | "closing"; deep?: boolean }

export type EpisodePlan = { title: Bilingual; questions: PlanQuestion[] }

export type TurnKind =
  | "opener"
  | "question"
  | "followup"
  | "nudge"
  | "rephrase"
  | "transition"
  | "comfort"
  | "closing"
  | "outro"

// One thing the host said, plus what the guest answered right after it.
export type Turn = {
  kind: TurnKind
  text: string
  lang: Lang
  at: number // ms on the recording clock (pauses excluded)
  endAt: number
  answer: string
  segments: { start: number; end: number; text: string }[]
  // The playbook technique behind an AI line (follow-ups, nudges).
  technique?: string
}

// The guest's memory of earlier episodes, kept in the browser and sent along so
// the host can call back to them.
export type PastEpisode = {
  id: string
  date: string
  themeId: string
  lang: EpisodeLang
  title: string
  summary: string
}

export type HostDecision = { action: "follow_up" | "move_on"; technique: string; line: string }

// Everything one recording turns into.
export type ContentPack = {
  clips: { turn: number; hook: string; onScreenText: string; caption: string; hashtags: string[] }[]
  linkedin: string
  instagram: { caption: string; carousel: string[] }
  youtube: {
    titles: string[]
    description: string
    chapters: { turn: number; title: string }[]
    tags: string[]
    thumbnailText: string
  }
  summary: string
}
