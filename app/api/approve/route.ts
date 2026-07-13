import { NextResponse, type NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const APPROVAL_FIELD = "fldZ8KXT6KpJjZhaU"
const COMMENT_FIELD = "fldOwvLIfHA3zM1XV"

const ALLOWED_DECISIONS = new Set(["Approuvé", "À ajuster"])

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

  if (token !== process.env.VALIDATION_TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  if (typeof recordId !== "string" || recordId.length === 0) {
    return NextResponse.json({ ok: false, error: "missing_record" }, { status: 400 })
  }

  if (typeof decision !== "string" || !ALLOWED_DECISIONS.has(decision)) {
    return NextResponse.json({ ok: false, error: "invalid_decision" }, { status: 400 })
  }

  const airtableToken = process.env.AIRTABLE_TOKEN
  const base = process.env.AIRTABLE_BASE
  const table = process.env.AIRTABLE_TABLE

  if (!airtableToken || !base || !table) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 })
  }

  try {
    const res = await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${airtableToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        records: [
          {
            id: recordId,
            fields: {
              [APPROVAL_FIELD]: decision,
              [COMMENT_FIELD]: typeof comment === "string" ? comment : "",
            },
          },
        ],
        typecast: true,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      return NextResponse.json(
        { ok: false, error: "airtable", status: res.status, detail: detail.slice(0, 500) },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "fetch_failed" },
      { status: 502 },
    )
  }
}
