import { NextResponse, type NextRequest } from "next/server"
import { isAdmin, isCron } from "@/lib/content-ops/auth"
import { emailConfigured, emailLayout, escapeHtml, sendEmail, type EmailResult } from "@/lib/content-ops/notify"
import { buildOverview, type BusinessOverview, type PostRef } from "@/lib/content-ops/overview"
import { siteOrigin } from "@/lib/content-ops/registry"
import { addDays } from "@/lib/content-ops/standard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

// Runs once a day (vercel.json → crons). Every active business follows the same
// rules:
//  • Monday: approvers with posts awaiting a decision get one digest email.
//  • Other days: approvers get a reminder only when an undecided post is due
//    within 3 days.
//  • Every day with something to act on: Pam gets her morning point (changes
//    requested, approved posts to schedule, overdue posts).
// Call it manually with ?key=<ADMIN_TOKEN>&dry=1 to preview without sending.

type Planned = { to: string; subject: string; kind: string; business?: string; result?: EmailResult }

function frDate(iso: string): string {
  if (!iso) return "sans date"
  const d = new Date(`${iso}T12:00:00Z`)
  return new Intl.DateTimeFormat("fr-CA", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" }).format(d)
}

function listHtml(posts: PostRef[], max = 12): string {
  const items = posts
    .slice(0, max)
    .map((p) => `<li style="margin:4px 0"><strong>${escapeHtml(frDate(p.date))}</strong> · ${escapeHtml(p.title || "Sans titre")}${p.channel ? ` <span style="color:#00321999">(${escapeHtml(p.channel)})</span>` : ""}</li>`)
    .join("")
  const more = posts.length > max ? `<li>… et ${posts.length - max} autre(s)</li>` : ""
  return `<ul style="padding-left:18px">${items}${more}</ul>`
}

function listText(posts: PostRef[], max = 12): string {
  return posts
    .slice(0, max)
    .map((p) => `• ${frDate(p.date)} · ${p.title || "Sans titre"}${p.channel ? ` (${p.channel})` : ""}`)
    .join("\n")
}

function approverEmails(b: BusinessOverview, isMonday: boolean, today: string): Planned & { html: string; text: string } | null {
  if (!b.reminders || !b.approverEmail || !b.portalUrl || !b.summary) return null
  const hello = b.approverName ? `Bonjour ${escapeHtml(b.approverName)},` : "Bonjour,"
  const helloText = b.approverName ? `Bonjour ${b.approverName},` : "Bonjour,"

  if (isMonday && b.awaiting.length > 0) {
    const n = b.awaiting.length
    const subject = `${b.name} · ${n} publication${n > 1 ? "s" : ""} à valider cette semaine`
    return {
      to: b.approverEmail, subject, kind: "digest", business: b.slug,
      html: emailLayout(
        `${n} publication${n > 1 ? "s" : ""} t’attend${n > 1 ? "ent" : ""}`,
        `<p>${hello}</p><p>Voici le contenu prêt pour ta validation :</p>${listHtml(b.awaiting)}<p>Un clic par publication : ✅ Approuvé ou ✏️ À ajuster avec un petit mot.</p>`,
        { label: "Valider mon calendrier", href: b.portalUrl },
      ),
      text: `${helloText}\n\nVoici le contenu prêt pour ta validation :\n${listText(b.awaiting)}\n\nValider : ${b.portalUrl}`,
    }
  }

  const soon = addDays(today, 3)
  const urgent = b.awaiting.filter((p) => p.date && p.date >= today && p.date <= soon)
  if (urgent.length > 0) {
    const subject = `${b.name} · rappel : ${urgent.length} publication${urgent.length > 1 ? "s" : ""} à valider d’ici ${frDate(urgent[0].date)}`
    return {
      to: b.approverEmail, subject, kind: "reminder", business: b.slug,
      html: emailLayout(
        "Petit rappel 🌿",
        `<p>${hello}</p><p>Ces publications partent bientôt et attendent encore ton feu vert :</p>${listHtml(urgent)}`,
        { label: "Valider maintenant", href: b.portalUrl },
      ),
      text: `${helloText}\n\nCes publications partent bientôt et attendent encore ton feu vert :\n${listText(urgent)}\n\nValider : ${b.portalUrl}`,
    }
  }
  return null
}

function pamEmail(rows: BusinessOverview[], adminUrl: string | null): (Planned & { html: string; text: string }) | null {
  const to = process.env.NOTIFY_EMAIL
  if (!to) return null
  const sections: string[] = []
  const textSections: string[] = []
  let total = 0
  for (const b of rows) {
    if (b.error) {
      sections.push(`<h3 style="margin:20px 0 4px">${escapeHtml(b.name)}</h3><p style="color:#a33">Lecture Airtable impossible : ${escapeHtml(b.error)}</p>`)
      textSections.push(`${b.name}: lecture Airtable impossible (${b.error})`)
      total++
      continue
    }
    const parts: string[] = []
    const textParts: string[] = []
    if (b.toFix.length) {
      parts.push(`<p><strong>✏️ ${b.toFix.length} à ajuster</strong></p>${listHtml(b.toFix, 6)}`)
      textParts.push(`✏️ ${b.toFix.length} à ajuster\n${listText(b.toFix, 6)}`)
    }
    if (b.approvedToSchedule.length) {
      parts.push(`<p><strong>✅ ${b.approvedToSchedule.length} approuvée(s) à programmer</strong></p>${listHtml(b.approvedToSchedule, 6)}`)
      textParts.push(`✅ ${b.approvedToSchedule.length} approuvée(s) à programmer\n${listText(b.approvedToSchedule, 6)}`)
    }
    if (b.overdue.length) {
      parts.push(`<p><strong>⏰ ${b.overdue.length} en retard</strong></p>${listHtml(b.overdue, 6)}`)
      textParts.push(`⏰ ${b.overdue.length} en retard\n${listText(b.overdue, 6)}`)
    }
    if (parts.length === 0) continue
    total++
    sections.push(`<h3 style="margin:24px 0 4px;font-family:Georgia,serif">${escapeHtml(b.name)}</h3>${parts.join("")}`)
    textSections.push(`== ${b.name} ==\n${textParts.join("\n")}`)
  }
  if (total === 0) return null
  return {
    to,
    subject: `Ton point Content Ops · ${total} entreprise${total > 1 ? "s" : ""} à regarder`,
    kind: "pam",
    html: emailLayout("Ton point du matin", sections.join(""), adminUrl ? { label: "Ouvrir le tableau de bord", href: adminUrl } : undefined),
    text: `${textSections.join("\n\n")}${adminUrl ? `\n\nTableau de bord : ${adminUrl}` : ""}`,
  }
}

async function run(request: NextRequest) {
  const cron = isCron(request)
  const admin = isAdmin(request)
  if (!cron && !admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  // A manual call is a preview unless it explicitly asks to send (?send=1).
  const dry = !cron && request.nextUrl.searchParams.get("send") !== "1"

  const origin = siteOrigin(request.nextUrl.origin)
  const { today, source, businesses } = await buildOverview(origin)
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "America/Toronto" }).format(new Date())
  const isMonday = request.nextUrl.searchParams.get("monday") === "1" || weekday === "Mon"
  const adminUrl = process.env.ADMIN_TOKEN
    ? `${origin}/validation/admin?key=${encodeURIComponent(process.env.ADMIN_TOKEN)}`
    : null

  const emails = [
    ...businesses.map((b) => approverEmails(b, isMonday, today)),
    pamEmail(businesses, adminUrl),
  ].filter((e): e is NonNullable<typeof e> => e !== null)

  const planned: Planned[] = []
  for (const email of emails) {
    const result = dry ? undefined : await sendEmail(email.to, email.subject, email.html, email.text)
    planned.push({ to: email.to, subject: email.subject, kind: email.kind, business: email.business, result })
  }

  return NextResponse.json({
    today,
    isMonday,
    dry,
    registry: source,
    emailConfigured: emailConfigured(),
    emails: planned,
    skipped: businesses
      .filter((b) => !b.approverEmail || !b.reminders)
      .map((b) => ({ business: b.slug, reason: !b.reminders ? "rappels désactivés" : "pas de courriel approbateur" })),
  })
}

export const GET = run
export const POST = run
