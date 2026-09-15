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

export type ValidationClient = {
  slug: string
  base: string
  table: string
  view?: string
  fields: ClientFields
}

type ClientDef = Omit<ValidationClient, "base" | "table" | "view"> & {
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
]

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
      }
    }
  }
  return null
}
