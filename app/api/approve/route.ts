import { NextResponse, type NextRequest } from "next/server"
import { AirtableError, asString, getRecord, updateRecord } from "@/lib/content-ops/airtable"
import { emailLayout, escapeHtml, sendEmail } from "@/lib/content-ops/notify"
import { resolveFields } from "@/lib/content-ops/posts"
import { siteOrigin, resolveBusinessByToken } from "@/lib/content-ops/registry"
import { ADJUST, APPROVED } from "@/lib/content-ops/standard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_DECISIONS = new Set<string>([APPROVED, ADJUST])

type ApproveBody = {
  token?: unknown
  recordId?: unknown
  decision?: unknown
  comment?: unknown
}

export async function POST(request: NextRequest) {
  let body: ApproveBody
  try {
    body = (await request.json()) as ApproveBody
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }

  const { token, recordId, decision, comment } = body

  if (typeof recordId !== "string" || !/^rec[A-Za-z0-9]{14}$/.test(recordId)) {
    return NextResponse.json({ ok: false, error: "missing_record" }, { status: 400 })
  }
  if (typeof decision !== "string" || !ALLOWED_DECISIONS.has(decision)) {
    return NextResponse.json({ ok: false, error: "invalid_decision" }, { status: 400 })
  }
  const note = typeof comment === "string" ? comment.slice(0, 5000) : ""

  try {
    const business = await resolveBusinessByToken(token)
    if (!business) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }

    // Field names come from the registry overrides or the standard names; the
    // record itself also tells us which aliases this base uses.
    const record = await getRecord(business.base, business.table, recordId)
    if (!record) {
      return NextResponse.json({ ok: false, error: "unknown_record" }, { status: 404 })
    }
    const fields = resolveFields(business, [record])

    const label = decision === APPROVED ? business.labels.approved : business.labels.adjust
    await updateRecord(business.base, business.table, recordId, {
      [fields.approval]: label,
      [fields.comment]: note,
    })

    // Internal alert: Pam hears about requested changes right away.
    if (decision === ADJUST && process.env.NOTIFY_EMAIL) {
      const title = asString(record.fields[fields.title]) || "Publication"
      const date = asString(record.fields[fields.date]).slice(0, 10)
      const adminKey = process.env.ADMIN_TOKEN
      const origin = siteOrigin(request.nextUrl.origin)
      await sendEmail(
        process.env.NOTIFY_EMAIL,
        `✏️ ${business.name} demande un ajustement — ${title}`,
        emailLayout(
          `${business.name} : ajustement demandé`,
          `<p><strong>${escapeHtml(title)}</strong>${date ? ` · ${escapeHtml(date)}` : ""}</p>
<blockquote style="border-left:3px solid #B5822B;margin:16px 0;padding:4px 16px">${escapeHtml(note || "(pas de commentaire)").replace(/\n/g, "<br>")}</blockquote>`,
          adminKey ? { label: "Ouvrir le tableau de bord", href: `${origin}/validation/admin?key=${encodeURIComponent(adminKey)}` } : undefined,
        ),
        `${business.name} demande un ajustement sur « ${title} » (${date}).\n\n${note || "(pas de commentaire)"}`,
      ).catch(() => undefined)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AirtableError) {
      return NextResponse.json(
        { ok: false, error: error.status === 500 ? "misconfigured" : "airtable", status: error.status, detail: error.detail },
        { status: error.status === 500 ? 500 : 502 },
      )
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "fetch_failed" },
      { status: 502 },
    )
  }
}
