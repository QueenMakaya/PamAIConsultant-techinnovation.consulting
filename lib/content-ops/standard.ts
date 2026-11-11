// The standard content-calendar schema shared by every business (clients and
// Pam's own ventures). New bases are built from the template with exactly the
// first name of each list; older bases keep their own spelling and are matched
// through the aliases, so nothing has to be renamed in Airtable.

export type FieldKey =
  | "title"
  | "date"
  | "channel"
  | "format"
  | "caption"
  | "hashtags"
  | "link"
  | "visuals"
  | "status"
  | "approval"
  | "comment"

export const FIELD_ALIASES: Record<FieldKey, string[]> = {
  title: ["Titre", "Titre / Sujet", "Title / Topic", "Title", "Post Title", "Sujet"],
  date: ["Date", "Date de publication", "Publish date", "Publish Date", "Date Scheduled", "Date publication"],
  channel: ["Plateforme", "Canal", "Channel", "Platform", "Plateformes", "Platform Social Media"],
  format: ["Format", "Type of Post"],
  caption: ["Légende proposée", "Légende / Contenu", "Caption / Content", "Légende", "Caption", "Content", "Body"],
  hashtags: ["Hashtags", "Mots-clés / Hashtags"],
  link: ["Lien publié", "Lien du post", "Post Link", "Lien", "Link"],
  visuals: ["Visuels", "Visuel", "Visual", "Visuals", "Images", "Image Post - Optional"],
  status: ["Statut production", "Statut (PUBLICATION)", "Status (Publication)", "Statut", "Status", "Post Status"],
  approval: ["Validation client"],
  comment: ["Commentaires client"],
}

// ---- Option normalisation ----------------------------------------------------
// Option labels drift between bases ("Publié" / "Published", "✅ Approuvé").
// Everything is compared through a normalised key: emojis, accents, case and
// punctuation removed.

export function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export type ProductionStage =
  | "idea"
  | "to_produce"
  | "ready"
  | "scheduled"
  | "published"
  | "cancelled"
  | "unknown"

const STAGE_SYNONYMS: Record<Exclude<ProductionStage, "unknown">, string[]> = {
  idea: ["idee", "idea"],
  to_produce: [
    "a produire", "to produce", "to write", "a ecrire", "a filmer", "draft",
    "visual required", "visuel requis", "missing visual s", "visuel s manquant s",
    "script pret", "personnage a generer", "en montage",
  ],
  ready: [
    "pret", "ready", "ready to post", "pret a publier", "awaiting approval",
    "en attente d approbation", "en validation", "visual to update", "visuel a mettre a jour",
  ],
  scheduled: ["programme", "programmed", "scheduled", "planifie"],
  published: ["publie", "published", "posted", "en ligne"],
  cancelled: ["annule", "canceled", "cancelled", "abandonne"],
}

export function toStage(label: string): ProductionStage {
  const key = normalizeLabel(label)
  if (!key) return "unknown"
  for (const [stage, words] of Object.entries(STAGE_SYNONYMS)) {
    if (words.includes(key)) return stage as ProductionStage
  }
  return "unknown"
}

// Stages that take a post out of the client's validation view.
export const HIDDEN_STAGES: ProductionStage[] = ["scheduled", "published", "cancelled"]

// Canonical approval labels spoken by the portal and its API.
export const APPROVED = "Approuvé"
export const ADJUST = "À ajuster"
export const PENDING = "À valider"

export type Decision = "approved" | "adjust" | "rejected" | "pending"

export function toDecision(label: string): Decision {
  const key = normalizeLabel(label)
  if (["approuve", "approved", "valide", "published", "publie"].includes(key)) return "approved"
  if (["a ajuster", "to adjust", "needs changes", "changes requested"].includes(key)) return "adjust"
  if (key === "rejete" || key === "rejected") return "rejected"
  return "pending"
}

export function canonicalApproval(label: string): string {
  const d = toDecision(label)
  if (d === "approved") return APPROVED
  if (d === "adjust") return ADJUST
  return label
}

// Montréal "today" as YYYY-MM-DD, the timezone every calendar is planned in.
export function todayInMontreal(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(now)
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
