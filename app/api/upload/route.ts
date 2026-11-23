// Client file drop from the validation page: a photo or video the client adds
// to a post lands directly in that post's visuals cell in Airtable.

import { NextResponse, type NextRequest } from "next/server"
import { AirtableError, getRecord, listRecords, uploadAttachment } from "@/lib/content-ops/airtable"
import { mapVisuals, resolveFields } from "@/lib/content-ops/posts"
import { resolveBusinessByToken } from "@/lib/content-ops/registry"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Vercel caps a request body at 4.5 MB and Airtable's upload at 5 MB.
const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED = /^(image|video)\/|^application\/pdf$/

export async function POST(request: NextRequest) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_form" }, { status: 400 })
  }

  const token = form.get("token")
  const recordId = form.get("recordId")
  const file = form.get("file")

  if (typeof recordId !== "string" || !/^rec[A-Za-z0-9]{14}$/.test(recordId)) {
    return NextResponse.json({ ok: false, error: "missing_record" }, { status: 400 })
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 })
  }
  const contentType = file.type || "application/octet-stream"
  if (!ALLOWED.test(contentType)) {
    return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 415 })
  }

  try {
    const business = await resolveBusinessByToken(typeof token === "string" ? token : null)
    if (!business) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }
    // The record must belong to this client's calendar.
    const record = await getRecord(business.base, business.table, recordId)
    if (!record) {
      return NextResponse.json({ ok: false, error: "unknown_record" }, { status: 404 })
    }
    // An empty cell is omitted from the record, so when this post has no visual
    // yet, read the other rows to learn which name this base gives the field.
    let fields = resolveFields(business, [record])
    if (!(fields.visuals in record.fields) && !business.fieldOverrides.visuals) {
      fields = resolveFields(business, await listRecords(business.base, business.table))
    }

    const cell = await uploadAttachment(business.base, recordId, fields.visuals, {
      bytes: await file.arrayBuffer(),
      contentType,
      filename: (file.name || "fichier").slice(0, 200),
    })
    return NextResponse.json({ ok: true, visuals: mapVisuals(cell) })
  } catch (error) {
    if (error instanceof AirtableError) {
      return NextResponse.json(
        { ok: false, error: "airtable", status: error.status, detail: error.detail },
        { status: 502 },
      )
    }
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 502 })
  }
}
