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

// Opt-in, per-client: drop records whose production-status single-select is one
// of the excluded options, so e.g. already-scheduled posts leave the validation
// view. Records are fetched with returnFieldsByFieldId=true, which keys fields by
// ID but still returns single-select *values* as the option label string — so we
// match on both the option IDs and the option labels to be robust.
export type HideWhenScheduled = {
  statusFieldId: string
  excludeOptionIds: string[]
  excludeOptionNames: string[]
}

export type ValidationClient = {
  slug: string
  base: string
  table: string
  view?: string
  fields: ClientFields
  approvalLabels: ApprovalLabels
  hideWhenScheduled?: HideWhenScheduled
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
    // Once a post is scheduled/published it leaves the validation view; only
    // posts still needing validation (Idée, Prêt, À produire) stay visible.
    hideWhenScheduled: {
      statusFieldId: "fld6MsgbL1yeBwGqS", // Statut production
      excludeOptionIds: ["selIpAjxIUlvid2gN", "selUx2Hhd5pyPrgbA"], // Programmé, Publié
      excludeOptionNames: ["Programmé", "Publié"],
    },
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
  {
    // ROOMA / Room in Africa "Calendrier".
    slug: "rooma",
    tokenEnv: "ROOMA_VALIDATION_TOKEN",
    base: () => "appPuYrpgIa4lIFbn",
    table: () => "tbltCcaNqkF0kkPTm",
    // Once a post is scheduled/published it leaves the validation view; only
    // posts still needing validation (Idée, Prêt, À produire) stay visible.
    hideWhenScheduled: {
      statusFieldId: "fldi0zfeNn4MGLmgb", // Statut production
      excludeOptionIds: ["selAIXt8UfJtOKWzU", "selmyBtS6Hah0wCIR"], // Programmé, Publié
      excludeOptionNames: ["Programmé", "Publié"],
    },
    fields: {
      title: "fld5e9OrVR8rWCgqC", // Titre
      date: "fldONRjNmXTcq9Nce", // Date
      channel: "fldfWb62vpH2EFX6U", // Plateforme
      format: "fldNOosuEQ2HCX8WA", // Format
      caption: "fldGRYmTBZezhrmUt", // Légende proposée
      hashtags: "fldA9ZY7lquNGGdoP", // Mots-clés / Hashtags
      link: "fld68HVQaXd7OMU5V", // Lien publié
      visuals: "fldA4aa9eQOJuuHVs", // Visuels
      approval: "fldapXKg8RW2Jzmxo", // Validation client
      comment: "fldOQDWJJLooWoHYY", // Commentaires ROOMA
    },
  },
  {
    // Folashade (Folashade Wax, Montréal) "Calendrier".
    slug: "folashade",
    tokenEnv: "FOLASHADE_VALIDATION_TOKEN",
    base: () => "appS1AZLNH7Smy2Ds",
    table: () => "tbl7mDYDXGHTn69YT",
    // Once a post is scheduled/published it leaves the validation view; only
    // posts still needing validation (Idée, À produire, Prêt) stay visible.
    hideWhenScheduled: {
      statusFieldId: "fldQJKxAJBp2CkTkN", // Statut production
      excludeOptionIds: ["sel4g8HfdTy1NAVds", "sel7JjBOhA9Mzc02w"], // Programmé, Publié
      excludeOptionNames: ["Programmé", "Publié"],
    },
    fields: {
      title: "fldPer8J35KcWsa02", // Titre
      date: "fld0TlgMc8pC5gXcd", // Date
      channel: "fldGzFs9AOvdeu5oH", // Plateforme
      format: "fldHubZDCWhuNQxs1", // Format
      caption: "fldRrrNWw20QEV6yw", // Légende proposée
      hashtags: "fldhU3tLetuDLKZfM", // Mots-clés / Hashtags
      link: "fldCm6tEYaW90etT9", // Lien publié
      visuals: "fld3pbfVoTYfEHFi5", // Visuels
      approval: "fld9mAoohLuGqSOHq", // Validation client
      comment: "fld4iZJIi8fOr3dGZ", // Commentaires Folashade
    },
  },
  {
    // Centre Holistic Ethnika "Calendrier".
    slug: "ethnika",
    tokenEnv: "ETHNIKA_VALIDATION_TOKEN",
    base: () => "appbejIYzqSPcOj5W",
    table: () => "tbls1FHLh2VVlFHTU",
    // Once a post is scheduled/published it leaves the validation view; only
    // posts still needing validation (Idée, À produire, Prêt) stay visible.
    hideWhenScheduled: {
      statusFieldId: "fldcbRVOHHYU05IJ8", // Statut production
      excludeOptionIds: ["selkSWPEvHDl9DNDQ", "selEAaywNLm0IqwI0"], // Programmé, Publié
      excludeOptionNames: ["Programmé", "Publié"],
    },
    fields: {
      title: "fldzl7jGA6Yo1hIaW", // Titre
      date: "fldubFvQVFkeoXVw7", // Date
      channel: "flddnT0zNeqVnqOdm", // Plateforme
      format: "fldO05HS5GOi3HNSt", // Format
      caption: "fldl4K9WWL9vr1Zc3", // Légende proposée
      hashtags: "fldks2mMMs8EZ4qc3", // Mots-clés / Hashtags
      link: "fldFZJmxqwoHTI5cs", // Lien publié
      visuals: "fldIDsCmjKg1LFfZw", // Visuels
      approval: "fldYoBPH4AD7AUSj9", // Validation client
      comment: "fldF3CxiiFtQwhLCn", // Commentaires Ethnika
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
        hideWhenScheduled: client.hideWhenScheduled,
      }
    }
  }
  return null
}
