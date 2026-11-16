// Lead data quality: the same checks run in the browser (so the prospect can
// fix a mistake while typing) and on the server (so nothing unchecked is ever
// stored). Every function returns a normalized value or null, never a guess.

// The six regional county municipalities (MRC) of Lanaudière.
export const LANAUDIERE_MRCS = [
  "Les Moulins",
  "L'Assomption",
  "Joliette",
  "D'Autray",
  "Montcalm",
  "Matawinie",
] as const
export const OTHER_REGION = "Autre région"
export const MRC_CHOICES = [...LANAUDIERE_MRCS, OTHER_REGION] as const

// Shown as a hint under the list so the prospect picks the right MRC.
export const MRC_HINTS: Record<(typeof MRC_CHOICES)[number], string> = {
  "Les Moulins": "Terrebonne, Mascouche",
  "L'Assomption": "Repentigny, L'Assomption, Charlemagne",
  Joliette: "Joliette, Notre-Dame-des-Prairies, Saint-Charles-Borromée",
  "D'Autray": "Berthierville, Lavaltrie, Lanoraie",
  Montcalm: "Saint-Lin-Laurentides, Sainte-Julienne, Saint-Esprit",
  Matawinie: "Rawdon, Saint-Donat, Saint-Michel-des-Saints",
  "Autre région": "Mon entreprise est ailleurs au Québec",
}

export const ONLINE_PRESENCE = [
  "Aucune",
  "Facebook",
  "Instagram",
  "TikTok",
  "Site web",
  "Google / fiche entreprise",
] as const

export const GOALS = [
  "Gagner en visibilité",
  "Attirer plus de clients",
  "Vendre en ligne",
  "Automatiser et gagner du temps",
  "Structurer ma marque",
  "Autre",
] as const

export const AVAILABILITY = ["Matin", "Après-midi", "Soir", "Peu importe"] as const

/** North American number → "(450) 555-1234", or null when it cannot be one. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1)
  if (digits.length !== 10) return null
  // Area code and exchange never start with 0 or 1.
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return null
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

/** Canadian postal code → "J6W 1A1", or null when the format is impossible. */
export function normalizePostalCode(input: string): string | null {
  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (!/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(compact)) return null
  return `${compact.slice(0, 3)} ${compact.slice(3)}`
}

/** Every Lanaudière postal code starts with J (necessary, not sufficient). */
export function postalCodeCouldBeLanaudiere(postalCode: string): boolean {
  return postalCode.toUpperCase().startsWith("J")
}

/** "www.exemple.ca" → "https://www.exemple.ca/", or null when it is not a web address. */
export function normalizeWebsite(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname)) return null
    return url.toString()
  } catch {
    return null
  }
}

// Frequent slips on the domains Québec businesses actually use.
const DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.ca": "gmail.com",
  "gmaill.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotnail.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.con": "outlook.com",
  "outlook.co": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yaho.ca": "yahoo.ca",
  "icloud.con": "icloud.com",
  "iclou.com": "icloud.com",
  "icoud.com": "icloud.com",
  "videotron.com": "videotron.ca",
  "vidoetron.ca": "videotron.ca",
  "videotron.qc.ca": "videotron.ca",
  "sympatico.com": "sympatico.ca",
  "sympatcio.ca": "sympatico.ca",
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase()
}

/** A corrected address when the domain looks like a slip, otherwise null. */
export function suggestEmailFix(email: string): string | null {
  const at = email.lastIndexOf("@")
  if (at < 1) return null
  const local = email.slice(0, at)
  const domain = email.slice(at + 1).toLowerCase()
  const fixed = DOMAIN_TYPOS[domain]
  return fixed ? `${local}@${fixed}` : null
}

/** "marie-ève tremblay" → "Marie-Ève Tremblay". Leaves mixed-case input alone. */
export function tidyName(input: string): string {
  const collapsed = input.trim().replace(/\s+/g, " ")
  const hasLower = /\p{Ll}/u.test(collapsed)
  const hasUpper = /\p{Lu}/u.test(collapsed)
  if (hasLower && hasUpper) return collapsed
  return collapsed
    .toLocaleLowerCase("fr-CA")
    .replace(/(^|[\s'-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("fr-CA"))
}

/** Points a human should double-check before the call. Empty = nothing to flag. */
export function reviewFlags(lead: { email: string; mrc: string; postalCode: string; website: string }): string[] {
  const flags: string[] = []
  const fix = suggestEmailFix(lead.email)
  if (fix) flags.push(`Courriel : le domaine ressemble à une faute de frappe (voulait peut-être dire ${fix}).`)
  const inRegion = (LANAUDIERE_MRCS as readonly string[]).includes(lead.mrc)
  if (!inRegion) flags.push("Région : le prospect indique être hors Lanaudière.")
  if (inRegion && !postalCodeCouldBeLanaudiere(lead.postalCode)) {
    flags.push(`Code postal ${lead.postalCode} : ne commence pas par J, donc pas dans Lanaudière malgré la MRC choisie.`)
  }
  if (!lead.website) flags.push("Aucun site web fourni : confirmer le nom exact de l'entreprise à l'appel.")
  return flags
}
