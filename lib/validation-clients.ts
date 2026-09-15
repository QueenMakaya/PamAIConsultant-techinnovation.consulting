// Per-client config for the token-gated /validation page. The token passed in
// the URL selects the client; tokens themselves live only in env vars (this
// repo is public), base/table/field IDs are not secret.

export type ClientFields = {
  title: string
  date: string
  channel: string
  format: string
  caption: string
  hashtags: string | null // null → client has no hashtags field; return ""
  link: string
  visuals: string
  approval: string
  comment: string
}

// The page and /api/approve speak the canonical labels below; clients whose
// single-select options are spelled differently map them here. Writes use
// typecast:true, so a mismatch would silently create a new option.
export const APPROVED = "Approuvé"
export const ADJUST = "À ajuster"

export type ApprovalLabels = Record<typeof APPROVED | typeof ADJUST, string>

const DEFAULT_LABELS: ApprovalLabels = { [APPROVED]: APPROVED, [ADJUST]: ADJUST }

export type ValidationClient = {
  slug: string
  base: string
  table: string
  view?: string
  fields: ClientFields
  approvalLabels: ApprovalLabels
}

type ClientDef = Omit<ValidationClient, "base" | "table" | "view" | "approvalLabels"> & {
  approvalLabels?: ApprovalLabels
  tokenEnv: string
  base: () => string
  table: () => string
  view?: () => string | undefined
}

// Airtable field IDs (records are fetched with returnFieldsByFieldId=true).
const CLIENTS: ClientDef[] = [
  {
    // Anny's K "Content Calendar" — base/table/view can be overridden via env.
    slug: "annysk",
    tokenEnv: "VALIDATION_TOKEN",
    base: () => process.env.AIRTABLE_BASE || "appewRVgrp7nb51ky",
    table: () => process.env.AIRTABLE_TABLE || "tbldd33ltZe9ran3d",
    view: () => process.env.AIRTABLE_VIEW, // optional — omit to read the whole table
    fields: {
      title: "fldRPvHjX9ttg7Zuq",
      date: "flds3Pqa5NCw0sxUA",
      channel: "fld401OFcLHdxvoGL",
      format: "fldAJC3vX6IfkEv0X",
      caption: "fldXBa4oEgLFoTmX9",
      hashtags: "fldgGjCNn4jUT0jN5",
      link: "fldVHYG9tfW5SOGD4",
      visuals: "fld4P6xUg7dUrwEi8",
      approval: "fldZ8KXT6KpJjZhaU",
      comment: "fldOwvLIfHA3zM1XV",
    },
  },
  {
    // CHAFRIC "Calendrier".
    slug: "chafric",
    tokenEnv: "CHAFRIC_VALIDATION_TOKEN",
    base: () => "appNTAdE5R06eHkFF",
    table: () => "tbldnauStmzlJRb0l",
    fields: {
      title: "fld472KyjutpnHp6y", // Titre
      date: "fldtlTsO92yWEcoFI", // Date
      channel: "fldfHfcsDKo1NsyCp", // Plateforme
      format: "fldKZDs1RcEaBvUtW", // Format
      caption: "fldwIhMRWaeoZXDwd", // Légende proposée
      hashtags: null,
      link: "fldVFwglcMdvP4EB1", // Lien publié
      visuals: "fldrEesfxcEJFshOD", // Visuels
      approval: "fldteZMJRGEDknoaE", // Validation client
      comment: "fld0Ygzhitby2hLEp", // Commentaires CHAFRIC
    },
  },
  {
    // OK Pneus Terrebonne "Calendrier de contenu" — approval options carry emojis.
    slug: "okpneus",
    tokenEnv: "OKPNEUS_VALIDATION_TOKEN",
    base: () => "appzNmBQeCXPUVnff",
    table: () => "tblobreF74oLW96Es",
    approvalLabels: { [APPROVED]: "✅ Approuvé", [ADJUST]: "✏️ À ajuster" },
    fields: {
      title: "fldm3Pz6HBqTPoA0s", // Titre / Sujet
      date: "fldzKXoHET0Qdu6Rj", // Date de publication
      channel: "fldbllhvVLBiQumXx", // Canal
      format: "fldSaIWkabppLwrdI", // Format
      caption: "flddiucu0Iyikw9uV", // Légende / Contenu
      hashtags: null,
      link: "fldibe9cXZqhr8Uy4", // Lien
      visuals: "fldYtV4KpZ8IPB90a", // Visuel
      approval: "fldrnEufjMAeefTtd", // Approbation Sam
      comment: "fldvSt3oifN4jo9Xq", // Commentaire de Sam
    },
  },
]

// Airtable option label → canonical label the page understands.
export function toCanonicalApproval(client: ValidationClient, raw: string): string {
  if (raw === client.approvalLabels[APPROVED]) return APPROVED
  if (raw === client.approvalLabels[ADJUST]) return ADJUST
  return raw
}

export function resolveClient(token: unknown): ValidationClient | null {
  if (typeof token !== "string" || token.length === 0) return null
  for (const client of CLIENTS) {
    const expected = process.env[client.tokenEnv]
    if (expected && token === expected) {
      return {
        slug: client.slug,
        base: client.base(),
        table: client.table(),
        view: client.view?.(),
        fields: client.fields,
        approvalLabels: client.approvalLabels ?? DEFAULT_LABELS,
      }
    }
  }
  return null
}
