import { timingSafeEqual } from "node:crypto"
import type { NextRequest } from "next/server"

function same(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

// Pam's admin key (ADMIN_TOKEN), passed as ?key= or "Authorization: Bearer".
export function isAdmin(request: NextRequest): boolean {
  const expected = process.env.ADMIN_TOKEN
  if (!expected) return false
  const key =
    request.nextUrl.searchParams.get("key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    ""
  return same(key, expected)
}

// Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
export function isCron(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  const header = request.headers.get("authorization") ?? ""
  return same(header, `Bearer ${expected}`)
}
