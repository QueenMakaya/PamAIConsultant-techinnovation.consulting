import { NextResponse, type NextRequest } from "next/server"
import { ADJUST, APPROVED, resolveClient } from "@/lib/validation-clients"

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

  const client = resolveClient(token)
  if (!client) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  if (typeof recordId !== "string" || recordId.length === 0) {
    return NextResponse.json({ ok: false, error: "missing_record" }, { status: 400 })
  }

  if (typeof decision !== "string" || !ALLOWED_DECISIONS.has(decision)) {
    return NextResponse.json({ ok: false, error: "invalid_decision" }, { status: 400 })
  }

  const airtableToken = process.env.AIRTABLE_TOKEN
  const { base, table } = client

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
              [client.fields.approval]: client.approvalLabels[decision as typeof APPROVED | typeof ADJUST],
              [client.fields.comment]: typeof comment === "string" ? comment : "",
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
