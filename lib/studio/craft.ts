import type { Bilingual } from "./types"

// The host's interviewing playbook: documented techniques from great
// interviewers, mapped to the moments they're for. The live prompts pick from
// it, and every host line records the technique it used so episodes can be
// reviewed later. Guests can grow it with moves learned from interviews they
// admire (see LearnedMove).

export type TechniqueId =
  | "easy_entry"
  | "one_moment"
  | "mirror"
  | "say_more"
  | "label"
  | "specifics"
  | "before_after"
  | "why_once_more"
  | "lowest_point"
  | "affirm"
  | "viewer_lens"
  | "luck_or_work"
  | "for_sure"
  | "learned"

export type Technique = {
  id: TechniqueId
  name: string
  // When to reach for it.
  when: string
  // How to do it, for the model.
  how: string
  // A canned line used when the AI is off (silence nudges only).
  example: Bilingual
}

export const TECHNIQUES: Technique[] = [
  {
    id: "easy_entry",
    name: "Easy way in",
    when: "The guest is silent before starting an answer — frozen, searching, intimidated.",
    how: "Lower the bar: offer a small concrete door into the question (one client, one day, where they were sitting). Never repeat the original question word for word.",
    example: {
      fr: "Pas besoin de tout dire. Pense juste à un client, un seul. Comment ça a commencé avec lui ?",
      en: "No need to cover everything. Just think of one client. How did it start with them?",
    },
  },
  {
    id: "one_moment",
    name: "Tell me about the time…",
    when: "Any open question; when an answer stays general.",
    how: "Ask for one specific moment as a story (StoryCorps-style \"tell me about the time…\"): when, where, what happened.",
    example: {
      fr: "Raconte-moi un moment précis. C'était quand, et qu'est-ce qui s'est passé ?",
      en: "Tell me about one specific moment. When was it, and what happened?",
    },
  },
  {
    id: "mirror",
    name: "Mirror",
    when: "The guest pauses mid-answer after a charged or intriguing phrase.",
    how: "Repeat the last one to three meaningful words they said, as a gentle question (Chris Voss's mirroring). Nothing else.",
    example: { fr: "Et ensuite ?", en: "And then?" },
  },
  {
    id: "say_more",
    name: "Say more",
    when: "The guest stops just as it gets interesting.",
    how: "Invite them to keep going on the exact thread they opened: \"say more about…\", \"what happened next?\"",
    example: {
      fr: "Attends, reste là-dessus. Qu'est-ce qui s'est passé juste après ?",
      en: "Wait, stay on that. What happened right after?",
    },
  },
  {
    id: "label",
    name: "Label the feeling",
    when: "The guest describes something emotional without naming the feeling.",
    how: "Name the emotion you hear, tentatively (\"it sounds like…\"), then let them confirm or correct it (Chris Voss's labeling).",
    example: { fr: "On dirait que ce moment compte encore beaucoup pour toi.", en: "It sounds like that moment still matters a lot to you." },
  },
  {
    id: "specifics",
    name: "Make it concrete",
    when: "The answer is abstract, a claim without proof, or missing names, numbers, places.",
    how: "Ask for the number, the name, the date, the exact words someone said. Concrete details are what make viewers trust and buy.",
    example: { fr: "Tu as un chiffre en tête ?", en: "Do you have a number in mind?" },
  },
  {
    id: "before_after",
    name: "Before / after",
    when: "The guest describes a result or a client win.",
    how: "Contrast what life looked like before and after — the transformation is the story that sells the offer.",
    example: {
      fr: "Et avant toi, sa semaine ressemblait à quoi ?",
      en: "And before you came along, what did their week look like?",
    },
  },
  {
    id: "why_once_more",
    name: "Why, once more",
    when: "The guest explains what they did but not why.",
    how: "Ask why one more level down, to reach motivation and values. Once — never interrogate.",
    example: { fr: "Pourquoi c'était si important pour toi ?", en: "Why did that matter so much to you?" },
  },
  {
    id: "lowest_point",
    name: "The hardest moment",
    when: "Origin and journey stories that sound too smooth.",
    how: "Ask for the lowest or hardest moment and what got them through — the arc journey interviews like How I Built This rely on.",
    example: {
      fr: "C'était quoi, le moment le plus dur dans tout ça ?",
      en: "What was the hardest moment in all of this?",
    },
  },
  {
    id: "affirm",
    name: "Affirm",
    when: "The guest just shared something vulnerable or worked hard to answer.",
    how: "A short, sincere acknowledgement of the effort or courage before moving on (affirmations, from motivational interviewing). Never flattery.",
    example: { fr: "Merci de partager ça.", en: "Thank you for sharing that." },
  },
  {
    id: "viewer_lens",
    name: "Speak to the viewer",
    when: "A story is complete and holds a lesson.",
    how: "Turn the story outward: what would they tell someone watching who is in that situation right now? This creates the clip's value and a natural call to action.",
    example: {
      fr: "Si quelqu'un qui regarde vit exactement ça en ce moment, tu lui dis quoi ?",
      en: "If someone watching is going through exactly that right now, what do you tell them?",
    },
  },
  {
    id: "luck_or_work",
    name: "Luck or work",
    when: "Closing reflection on a journey.",
    how: "Ask how much of it was luck and how much was work — not for a binary answer, but to hear how they've reflected on it (Guy Raz's closing question).",
    example: {
      fr: "Avec le recul, c'était plutôt de la chance ou du travail ?",
      en: "Looking back, was it more luck or more work?",
    },
  },
  {
    id: "for_sure",
    name: "What you know for sure",
    when: "Closing an episode on a lesson.",
    how: "Ask what they now know for sure (a question Oprah Winfrey made famous). One sentence answers make great clips.",
    example: {
      fr: "Qu'est-ce que tu sais avec certitude aujourd'hui ?",
      en: "What do you know for sure today?",
    },
  },
]

// A move the guest's own host learned from an interview they admire.
export type LearnedMove = { name: string; when: string; how: string; example: string }

export function craftBlock(learned: LearnedMove[]): string {
  const core = TECHNIQUES.map((t) => `- ${t.id} — ${t.name}. When: ${t.when} How: ${t.how}`).join("\n")
  const extra = learned.length
    ? `\n\nMoves this show's host learned from interviews the guest admires (use "learned" as the technique id):\n${learned
        .slice(0, 20)
        .map((m) => `- ${m.name}. When: ${m.when} How: ${m.how} Example: ${m.example}`)
        .join("\n")}`
    : ""
  return `Your interviewing playbook — pick the one technique that fits the moment:\n${core}${extra}`
}

export const TECHNIQUE_IDS = TECHNIQUES.map((t) => t.id).concat("learned") as [TechniqueId, ...TechniqueId[]]

export function techniqueName(id: string | undefined): string {
  if (!id) return ""
  if (id === "learned") return "Learned move"
  return TECHNIQUES.find((t) => t.id === id)?.name ?? ""
}
