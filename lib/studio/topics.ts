import type { Bilingual, Brief, Lang } from "./types"

// Topics any entrepreneur can pick for an episode. With the AI on, the host
// writes a fresh plan from the guest's brief; these questions are the fallback
// (and the shape the AI plan follows): hook-worthy opener → story → the people
// they help → the offer, told through a real moment → proof → what's next.

export type Topic = {
  id: string
  title: Bilingual
  blurb: Bilingual
  // Steers the AI plan: what this kind of episode is for.
  intent: string
  questions: Bilingual[]
}

export const TOPICS: Topic[] = [
  {
    id: "story",
    title: { fr: "Mon histoire", en: "My story" },
    blurb: { fr: "Pourquoi tu as commencé, et le chemin jusqu'ici.", en: "Why you started, and what got you here." },
    intent: "Origin story: earn trust by showing who the guest is and why they started, ending on why their offer exists.",
    questions: [
      { fr: "C'était quoi, le moment exact où tu as décidé de te lancer ?", en: "What was the exact moment you decided to start?" },
      { fr: "Qu'est-ce que tu faisais avant {business} ?", en: "What were you doing before {business}?" },
      { fr: "Qu'est-ce que tu as vu chez {audience} que les autres ne voyaient pas ?", en: "What did you see in {audience} that others missed?" },
      { fr: "Le jour où tu as failli tout arrêter, qu'est-ce qui t'a fait continuer ?", en: "The day you almost quit, what kept you going?" },
      { fr: "Aujourd'hui, si tu devais résumer ce que {business} change pour les gens, tu dirais quoi ?", en: "Today, if you had to sum up what {business} changes for people, what would you say?" },
    ],
  },
  {
    id: "offer",
    title: { fr: "Ce que je vends", en: "What I sell" },
    blurb: { fr: "Ton offre, expliquée par l'histoire de quelqu'un qui l'a vécue.", en: "Your offer, told through someone who lived it." },
    intent: "Sell without selling: make the offer concrete through the problem, a real client moment and the result, then invite the viewer to the call to action.",
    questions: [
      { fr: "Qui vient te voir, et dans quel état ils arrivent ?", en: "Who comes to you, and what state are they in when they arrive?" },
      { fr: "Concrètement, comment ça se passe quand quelqu'un travaille avec toi sur {offer} ?", en: "Concretely, what happens when someone works with you on {offer}?" },
      { fr: "Raconte-moi un client précis : avant, pendant, après.", en: "Tell me about one specific client: before, during, after." },
      { fr: "C'est quoi l'objection que tu entends le plus, et qu'est-ce que tu réponds ?", en: "What's the objection you hear most, and what do you answer?" },
      { fr: "Pour qui ce n'est pas fait ?", en: "Who is this not for?" },
      { fr: "Si quelqu'un qui regarde se reconnaît, il fait quoi maintenant ?", en: "If someone watching recognizes themselves, what should they do now?" },
    ],
  },
  {
    id: "client",
    title: { fr: "Une réussite client", en: "A client win" },
    blurb: { fr: "Un avant / après concret, avec des chiffres si tu peux.", en: "A concrete before / after, with numbers if you can." },
    intent: "Case study: one client's before, the turning point, the after, and what it proves about the offer.",
    questions: [
      { fr: "Présente-moi ce client. Où en était-il lors de votre premier échange ?", en: "Introduce this client. Where were they when they reached out?" },
      { fr: "Qu'est-ce qu'il avait déjà essayé, et pourquoi ça n'avait pas marché ?", en: "What had they already tried, and why didn't it work?" },
      { fr: "C'était quoi, le déclic pendant votre travail ensemble ?", en: "What was the breakthrough while you worked together?" },
      { fr: "Le résultat, en chiffres ou en vrai changement de vie ?", en: "The result, in numbers or in real-life change?" },
      { fr: "Qu'est-ce que cette histoire dit de ta façon de travailler ?", en: "What does this story say about the way you work?" },
    ],
  },
  {
    id: "behind",
    title: { fr: "Les coulisses", en: "Behind the scenes" },
    blurb: { fr: "Ta semaine, en vrai : victoires, galères, prochaine étape.", en: "Your week, for real: wins, struggles, next step." },
    intent: "Weekly build-in-public update: transparency that builds a following, ending on what's coming next for the offer.",
    questions: [
      { fr: "Cette semaine, tu as passé ton temps sur quoi ?", en: "What did you spend your week on?" },
      { fr: "Une victoire, même petite ?", en: "One win, even a small one?" },
      { fr: "Et ce qui a coincé ?", en: "And what got stuck?" },
      { fr: "Qu'est-ce que tes clients t'ont appris cette semaine ?", en: "What did your clients teach you this week?" },
      { fr: "La priorité de la semaine prochaine ?", en: "Next week's priority?" },
    ],
  },
  {
    id: "lessons",
    title: { fr: "Leçons apprises", en: "Lessons learned" },
    blurb: { fr: "Les erreurs qui t'ont coûté, et ce que tu fais autrement.", en: "The mistakes that cost you, and what you do differently now." },
    intent: "Expertise through mistakes: position the guest as the experienced guide their audience needs.",
    questions: [
      { fr: "Quelle erreur t'a coûté le plus cher depuis que tu as lancé {business} ?", en: "What mistake has cost you the most since you started {business}?" },
      { fr: "Qu'est-ce que tu dirais à quelqu'un qui commence aujourd'hui dans ton domaine ?", en: "What would you tell someone starting in your field today?" },
      { fr: "Un conseil populaire avec lequel tu n'es pas d'accord ?", en: "A popular piece of advice you disagree with?" },
      { fr: "Qu'est-ce que tu as arrêté de faire, et qui a tout changé ?", en: "What did you stop doing that changed everything?" },
      { fr: "Si {audience} ne devait retenir qu'une chose de toi, ce serait quoi ?", en: "If {audience} remembered only one thing from you, what would it be?" },
    ],
  },
  {
    id: "launch",
    title: { fr: "Un lancement", en: "A launch" },
    blurb: { fr: "Une nouvelle offre ou un nouveau produit à faire connaître.", en: "A new offer or product to get out there." },
    intent: "Launch: build anticipation for a new offer by telling why it exists, who it's for and how to get it.",
    questions: [
      { fr: "Qu'est-ce que tu lances, en une phrase ?", en: "What are you launching, in one sentence?" },
      { fr: "Pourquoi maintenant ? Qu'est-ce qui t'a donné envie de le créer ?", en: "Why now? What pushed you to create it?" },
      { fr: "Pour qui c'est fait, exactement ?", en: "Who exactly is it for?" },
      { fr: "Qu'est-ce qui le rend différent de ce qui existe déjà ?", en: "What makes it different from what's already out there?" },
      { fr: "Comment on y accède ?", en: "How do people get it?" },
    ],
  },
]

const FALLBACK = {
  fr: { business: "ton entreprise", offer: "ton offre", audience: "tes clients" },
  en: { business: "your business", offer: "your offer", audience: "your clients" },
}

// Fills {business}, {offer} and {audience} from the brief.
export function fillBrief(text: string, brief: Brief | null, lang: Lang): string {
  return text.replace(/\{(business|offer|audience)\}/g, (_, key: "business" | "offer" | "audience") => {
    const value = brief?.[key]?.trim()
    return value || FALLBACK[lang][key]
  })
}
