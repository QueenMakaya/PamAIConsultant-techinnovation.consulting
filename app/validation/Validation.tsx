"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useSearchParams } from "next/navigation"

// ---- Types (mirror the /api/calendar response) ------------------------------

type Visual = {
  id: string
  kind: "image" | "video"
  url: string
  preview: string | null
  filename: string
  width: number | null
  height: number | null
}

type Post = {
  id: string
  title: string
  date: string
  channel: string
  format: string
  caption: string
  hashtags: string
  link: string
  visuals: Visual[]
  approval: string
  comment: string
  brief?: string
}

type Beat = {
  key: string
  number: number
  title: string
  posts: Post[]
}

type SaveState = "idle" | "saving" | "saved" | "error"

const APPROVED = "Approuvé"
const ADJUST = "À ajuster"

// ---- Small presentational helpers -------------------------------------------

const PINE = "#003219"
const HONEY = "#B5822B"

function channelStyle(channel: string): { bg: string; fg: string } {
  const c = channel.toLowerCase()
  if (c.includes("tiktok")) return { bg: "#003219", fg: "#FAF6EE" }
  if (c.includes("insta")) return { bg: "#B5822B", fg: "#FAF6EE" }
  if (c.includes("face")) return { bg: "#1f4a37", fg: "#FAF6EE" }
  return { bg: "#e7ddc9", fg: "#003219" }
}

function formatDate(value: string): string {
  // A bare "YYYY-MM-DD" parses as UTC midnight, which shows as the previous
  // day in Montréal: read it at noon instead.
  const t = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)
  if (Number.isNaN(t)) return value || ""
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
    }).format(new Date(t))
  } catch {
    return value
  }
}

// A botanical stem that draws itself in proportion to review progress.
function BotanicalStem({ progress }: { progress: number }) {
  // progress: 0..1. We reveal the stem via stroke-dashoffset (pathLength = 100).
  const revealed = Math.max(0, Math.min(1, progress))
  const offset = 100 - revealed * 100
  const leafAt = (threshold: number) => (revealed >= threshold ? 1 : 0)

  return (
    <svg
      viewBox="0 0 40 120"
      className="h-14 w-auto shrink-0"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M20 118 C 20 92, 20 70, 20 6"
        stroke={HONEY}
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={offset}
        className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out"
      />
      {/* leaves fade in as the stem rises past them */}
      <path
        d="M20 92 C 8 88, 4 78, 6 70 C 16 74, 22 82, 20 92 Z"
        fill={PINE}
        opacity={leafAt(0.28)}
        className="motion-safe:transition-opacity motion-safe:duration-500"
      />
      <path
        d="M20 66 C 32 62, 36 52, 34 44 C 24 48, 18 56, 20 66 Z"
        fill={PINE}
        opacity={leafAt(0.55)}
        className="motion-safe:transition-opacity motion-safe:duration-500"
      />
      <path
        d="M20 40 C 8 36, 4 26, 6 18 C 16 22, 22 30, 20 40 Z"
        fill={PINE}
        opacity={leafAt(0.8)}
        className="motion-safe:transition-opacity motion-safe:duration-500"
      />
      {/* blossom at the top once everything is reviewed */}
      <circle
        cx="20"
        cy="6"
        r="4.5"
        fill={HONEY}
        opacity={leafAt(1)}
        className="motion-safe:transition-opacity motion-safe:duration-500"
      />
    </svg>
  )
}

// ---- Main component ----------------------------------------------------------

// ---- Month helpers (same filter model as the Studio IAM Beauté portal) ------

const FR_MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function monthKey(date: string): string {
  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : ""
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-")
  const name = FR_MONTHS[Number(month) - 1]
  return name ? `${name} ${year}` : key
}

function filterLabel(filter: string): string {
  if (filter === "carryover") return "À reprogrammer"
  if (filter === "all") return "Tous"
  return monthLabel(filter)
}

// Montréal's current month, "YYYY-MM" (keys compare lexically = by date).
function currentMonthKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date()).slice(0, 7)
}

// Lands on the current month when it has posts, else the next month that
// does, else the carry-over group, else everything.
function defaultFilter(posts: Post[]): string {
  const cur = currentMonthKey()
  const keys = new Set(posts.map((p) => monthKey(p.date)).filter(Boolean))
  if (keys.has(cur)) return cur
  const future = [...keys].filter((k) => k > cur).sort()
  if (future.length > 0) return future[0]
  if ([...keys].some((k) => k < cur)) return "carryover"
  return "all"
}

function groupByMonth(posts: Post[]): Array<[string, Post[]]> {
  const map = new Map<string, Post[]>()
  for (const p of posts) {
    const k = monthKey(p.date)
    map.set(k, [...(map.get(k) ?? []), p])
  }
  return [...map.entries()].sort(([a], [b]) => (a || "9999").localeCompare(b || "9999"))
}

// "NOV-10 - Retour en images" → "Retour en images"
function cleanTitle(title: string): string {
  return title.replace(/^\s*(?:[A-Z]{2,5}-)?\d+\s*[—–·:-]\s*/, "").trim() || title
}

function statusBadge(decision: string): { label: string; cls: string } {
  if (decision === APPROVED) return { label: "Approuvé", cls: "bg-[#003219]/10 text-[#003219]" }
  if (decision === ADJUST) return { label: "À ajuster", cls: "bg-[#B5822B]/15 text-[#8a6320]" }
  return { label: "À valider", cls: "bg-[#003219]/5 text-[#003219]/60" }
}

export default function Validation() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [status, setStatus] = useState<"loading" | "unauth" | "error" | "ready">("loading")
  const [business, setBusiness] = useState("")
  const [posts, setPosts] = useState<Post[]>([])

  // Per-record UI state, keyed by record id.
  const [decisions, setDecisions] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({})
  const [copied, setCopied] = useState(false)
  // Month filter: a "YYYY-MM" key, or the pseudo-keys "all" / "carryover".
  const [filter, setFilter] = useState<string>("all")

  const loadCalendar = useCallback(async () => {
    setStatus("loading")
    try {
      const res = await fetch(`/api/calendar?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      })
      if (res.status === 401) {
        setStatus("unauth")
        return
      }
      if (!res.ok) {
        setStatus("error")
        return
      }
      const data = (await res.json()) as { business?: string; posts?: Post[]; beats?: Beat[] }
      const nextPosts = data.posts ?? (data.beats ?? []).flatMap((b) => b.posts)
      setPosts(nextPosts)
      setBusiness(data.business ?? "")
      setFilter(defaultFilter(nextPosts))

      // Seed decisions / comments from Airtable's current values.
      const seedDecisions: Record<string, string> = {}
      const seedComments: Record<string, string> = {}
      for (const post of nextPosts) {
        if (post.approval === APPROVED || post.approval === ADJUST) {
          seedDecisions[post.id] = post.approval
        }
        seedComments[post.id] = post.comment ?? ""
      }
      setDecisions(seedDecisions)
      setComments(seedComments)
      setStatus("ready")
    } catch {
      setStatus("error")
    }
  }, [token])

  useEffect(() => {
    void loadCalendar()
  }, [loadCalendar])

  const CURRENT = currentMonthKey()

  const carryoverCount = useMemo(
    () => posts.filter((p) => { const k = monthKey(p.date); return !!k && k < CURRENT }).length,
    [posts, CURRENT],
  )

  // Chips: this month and each upcoming month, then "À reprogrammer" for
  // earlier unpublished posts, then "Tous".
  const chips = useMemo(() => {
    const keys = [...new Set(posts.map((p) => monthKey(p.date)).filter((k) => k && k >= CURRENT))].sort()
    const list: Array<{ key: string; label: string; count: number; carry?: boolean }> = keys.map((k) => ({
      key: k,
      label: monthLabel(k),
      count: posts.filter((p) => monthKey(p.date) === k).length,
    }))
    if (carryoverCount > 0) list.push({ key: "carryover", label: "À reprogrammer", count: carryoverCount, carry: true })
    list.push({ key: "all", label: "Tous", count: posts.length })
    return list
  }, [posts, carryoverCount, CURRENT])

  const visible = useMemo(() => {
    if (filter === "all") return posts
    if (filter === "carryover") return posts.filter((p) => { const k = monthKey(p.date); return !!k && k < CURRENT })
    return posts.filter((p) => monthKey(p.date) === filter)
  }, [posts, filter, CURRENT])

  // The counter and progress bar follow the posts in view.
  const total = visible.length
  const decided = useMemo(
    () => visible.filter((p) => decisions[p.id] === APPROVED || decisions[p.id] === ADJUST).length,
    [visible, decisions],
  )
  const progress = total > 0 ? decided / total : 0
  const pct = Math.round(progress * 100)

  const save = useCallback(
    async (post: Post, decision: string) => {
      setDecisions((d) => ({ ...d, [post.id]: decision }))
      setSaveStates((s) => ({ ...s, [post.id]: "saving" }))
      try {
        const res = await fetch("/api/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            recordId: post.id,
            decision,
            comment: comments[post.id] ?? "",
          }),
        })
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
        if (!res.ok || !data.ok) {
          setSaveStates((s) => ({ ...s, [post.id]: "error" }))
          return
        }
        setSaveStates((s) => ({ ...s, [post.id]: "saved" }))
      } catch {
        setSaveStates((s) => ({ ...s, [post.id]: "error" }))
      }
    },
    [token, comments],
  )

  // A file the client just added: show it on the card right away.
  const replaceVisuals = useCallback((postId: string, visuals: Visual[]) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, visuals } : p)))
  }, [])

  // Recap of every decided post (all months), grouped by month, with comments.
  const buildSummary = useCallback(() => {
    const lines: string[] = [`Mes retours sur le calendrier${business ? ` ${business}` : ""} 🌿`, ""]
    for (const [key, items] of groupByMonth(posts)) {
      const reviewed = items.filter((p) => decisions[p.id] === APPROVED || decisions[p.id] === ADJUST)
      if (reviewed.length === 0) continue
      lines.push(key ? monthLabel(key) : "Sans date")
      for (const post of reviewed) {
        const mark = decisions[post.id] === APPROVED ? "✅ Approuvé" : "✏️ À ajuster"
        const when = post.date ? ` (${formatDate(post.date)})` : ""
        lines.push(`• ${mark} : ${cleanTitle(post.title) || post.channel || "Post"}${when}`)
        const note = comments[post.id]?.trim()
        if (note) lines.push(`   ↳ ${note}`)
      }
      lines.push("")
    }
    return lines.join("\n").trim()
  }, [posts, decisions, comments, business])

  const hasFeedback = buildSummary().includes("•")

  const handleCopy = useCallback(async () => {
    const text = buildSummary()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }, [buildSummary])

  const whatsappHref = useMemo(
    () => `https://wa.me/?text=${encodeURIComponent(buildSummary())}`,
    [buildSummary],
  )

  // ---- Screen states --------------------------------------------------------

  if (status === "loading") {
    return (
      <Centered>
        <p className="text-lg text-[#003219]/70" style={{ fontFamily: "var(--font-fraunces), serif" }}>
          Le calendrier se charge…
        </p>
      </Centered>
    )
  }

  if (status === "unauth") {
    return (
      <Centered>
        <div className="max-w-md text-center">
          <h1
            className="mb-3 text-2xl text-[#003219]"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Lien non valide
          </h1>
          <p className="text-[#003219]/70">
            Ce lien de validation n’est pas reconnu. Vérifie que tu utilises bien le lien complet
            que je t’ai envoyé.
          </p>
        </div>
      </Centered>
    )
  }

  if (status === "error") {
    return (
      <Centered>
        <div className="max-w-md text-center">
          <h1
            className="mb-3 text-2xl text-[#003219]"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Oups, petit accroc
          </h1>
          <p className="mb-5 text-[#003219]/70">
            Je n’ai pas réussi à charger le calendrier. Ça vient sûrement de la connexion.
          </p>
          <button
            type="button"
            onClick={() => void loadCalendar()}
            className="rounded-full bg-[#003219] px-6 py-3 font-medium text-[#FAF6EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
          >
            Réessayer
          </button>
        </div>
      </Centered>
    )
  }

  if (posts.length === 0) {
    return (
      <Centered>
        <div className="max-w-md text-center">
          <BotanicalStem progress={0} />
          <h1
            className="mb-3 mt-4 text-2xl text-[#003219]"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Rien à valider pour l’instant
          </h1>
          <p className="text-[#003219]/70">
            Le calendrier est vide pour le moment. Je te préviens dès qu’il y a des posts à
            regarder 🌿
          </p>
        </div>
      </Centered>
    )
  }

  const done = total > 0 && decided === total
  const multiMonth = (filter === "all" || filter === "carryover") && groupByMonth(visible).length > 1

  const renderCard = (post: Post) => (
    <PostCard
      key={post.id}
      post={post}
      decision={decisions[post.id] ?? ""}
      comment={comments[post.id] ?? ""}
      saveState={saveStates[post.id] ?? "idle"}
      onComment={(value) => setComments((c) => ({ ...c, [post.id]: value }))}
      onDecision={(decision) => void save(post, decision)}
      onRetry={() => void save(post, decisions[post.id] ?? APPROVED)}
      token={token}
      onUploaded={(visuals) => replaceVisuals(post.id, visuals)}
    />
  )

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 sm:px-6">
      {/* Sticky progress + botanical stem */}
      <header className="sticky top-0 z-20 -mx-4 mb-2 border-b border-[#003219]/10 bg-[#FAF6EE]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <BotanicalStem progress={progress} />
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold uppercase tracking-wide text-[#B5822B]"
              style={{ letterSpacing: "0.08em" }}
            >
              Validation du calendrier{business ? ` · ${business}` : ""}
            </p>
            <p className="text-sm text-[#003219]/70">
              {done ? (
                <span className="font-medium text-[#003219]">Tout est passé en revue dans cette vue, merci 🌿</span>
              ) : (
                <>
                  <span className="font-semibold text-[#003219]">{decided}</span> sur {total} posts
                  validés
                  {filter !== "all" ? <span className="text-[#003219]/50"> · {filterLabel(filter)}</span> : null}
                </>
              )}
            </p>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#003219]/10"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progression de la validation"
            >
              <div
                className="h-full rounded-full bg-[#B5822B] motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Intro */}
      <div className="mb-6 mt-4">
        <h1
          className="text-3xl leading-tight text-[#003219] sm:text-4xl"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Ton calendrier de contenu
        </h1>
        <p className="mt-2 text-[#003219]/70">
          Pour chaque post&nbsp;: <strong className="font-semibold text-[#003219]">Approuver</strong>{" "}
          si c’est bon, ou <strong className="font-semibold text-[#003219]">À ajuster</strong> avec un
          petit mot pour me dire quoi changer. Tout s’enregistre au fur et à mesure.
        </p>
      </div>

      {/* Month filter */}
      {chips.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par mois">
          {chips.map((chip) => {
            const selected = filter === chip.key
            return (
              <button
                key={chip.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(chip.key)}
                className={[
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]",
                  selected
                    ? chip.carry
                      ? "border-[#8a2b1f] bg-[#8a2b1f] text-[#FAF6EE]"
                      : "border-[#003219] bg-[#003219] text-[#FAF6EE]"
                    : chip.carry
                      ? "border-[#8a2b1f]/40 text-[#8a2b1f] hover:bg-[#8a2b1f]/5"
                      : "border-[#003219]/20 text-[#003219]/75 hover:bg-[#003219]/5",
                ].join(" ")}
              >
                {chip.label}
                <span className="ml-1.5 opacity-70">{chip.count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Nudge toward carry-over posts when viewing a single month */}
      {carryoverCount > 0 && filter !== "carryover" && filter !== "all" && (
        <button
          type="button"
          onClick={() => setFilter("carryover")}
          className="mb-6 flex w-full items-center justify-between gap-3 rounded-xl border border-[#8a2b1f]/30 bg-[#8a2b1f]/5 px-4 py-3 text-left text-sm text-[#8a2b1f]"
        >
          <span>
            <strong>{carryoverCount}</strong> post{carryoverCount > 1 ? "s" : ""} d’un mois précédent{" "}
            {carryoverCount > 1 ? "ne sont" : "n’est"} pas encore publié{carryoverCount > 1 ? "s" : ""} : à
            reprogrammer.
          </span>
          <span className="whitespace-nowrap font-semibold">Voir →</span>
        </button>
      )}

      {filter === "carryover" && visible.length > 0 && (
        <p className="mb-6 text-sm text-[#003219]/60">
          Ces posts étaient prévus pour un mois précédent et n’ont pas été publiés : on les reprogramme.
        </p>
      )}

      {/* Posts */}
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-[#003219]/10 bg-white/60 p-6 text-center text-[#003219]/70">
          Aucun post dans cette vue. Essaie « Tous ».
        </p>
      ) : multiMonth ? (
        <div className="space-y-10">
          {groupByMonth(visible).map(([key, items]) => (
            <section key={key || "sans-date"} aria-labelledby={`month-${key || "none"}`}>
              <h2
                id={`month-${key || "none"}`}
                className={`mb-3 text-xl ${key && key < CURRENT ? "text-[#8a2b1f]" : "text-[#003219]"}`}
                style={{ fontFamily: "var(--font-fraunces), serif" }}
              >
                {key ? monthLabel(key) : "Sans date"}
                {key && key < CURRENT ? " · non publié" : ""}
              </h2>
              <div className="space-y-4">{items.map(renderCard)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-4">{visible.map(renderCard)}</div>
      )}

      {/* Summary / share */}
      <div className="mt-12 rounded-2xl border border-[#003219]/10 bg-white/60 p-5">
        <h2
          className="text-lg text-[#003219]"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Partager mes retours
        </h2>
        <p className="mt-1 text-sm text-[#003219]/70">
          {hasFeedback
            ? "Un récap de tes décisions et commentaires, prêt à m’envoyer."
            : "Approuve ou commente un post plus haut, ton récap apparaîtra ici."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!hasFeedback}
            onClick={() => void handleCopy()}
            className="rounded-full border-2 border-[#003219] px-5 py-2.5 text-sm font-medium text-[#003219] transition-colors hover:bg-[#003219] hover:text-[#FAF6EE] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
          >
            {copied ? "Copié ✓" : "Copier mes retours"}
          </button>
          <a
            href={hasFeedback ? whatsappHref : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!hasFeedback}
            className={`rounded-full bg-[#003219] px-5 py-2.5 text-sm font-medium text-[#FAF6EE] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B] ${hasFeedback ? "" : "pointer-events-none opacity-40"}`}
          >
            Envoyer sur WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

// ---- Sub-components ----------------------------------------------------------

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh items-center justify-center px-6 py-16">{children}</div>
}

function PostCard({
  post,
  decision,
  comment,
  saveState,
  onComment,
  onDecision,
  onRetry,
  token,
  onUploaded,
}: {
  post: Post
  decision: string
  comment: string
  saveState: SaveState
  onComment: (value: string) => void
  onDecision: (decision: string) => void
  onRetry: () => void
  token: string
  onUploaded: (visuals: Visual[]) => void
}) {
  const ch = channelStyle(post.channel)
  const approved = decision === APPROVED
  const adjust = decision === ADJUST

  return (
    <article className="overflow-hidden rounded-2xl border border-[#003219]/10 bg-white/70 shadow-sm">
      <VisualGallery visuals={post.visuals} title={post.title} />

      <div className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {post.channel ? (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: ch.bg, color: ch.fg }}
            >
              {post.channel}
            </span>
          ) : null}
          {post.format ? (
            <span className="rounded-full bg-[#003219]/8 px-2.5 py-1 text-xs font-medium text-[#003219]/80">
              {post.format}
            </span>
          ) : null}
          <span
            className={
              post.date
                ? "ml-auto text-xs text-[#003219]/60"
                : "ml-auto text-xs italic text-[#003219]/40"
            }
          >
            {post.date ? formatDate(post.date) : "Date à confirmer"}
          </span>
        </div>

        <div className="mb-2 flex items-start justify-between gap-3">
          {post.title ? (
            <h3
              className="text-lg leading-snug text-[#003219]"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              {cleanTitle(post.title)}
            </h3>
          ) : <span />}
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadge(decision).cls}`}
          >
            {statusBadge(decision).label}
          </span>
        </div>

        {post.caption ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#003219]">
            {post.caption}
          </p>
        ) : post.brief ? (
          <div className="rounded-xl border border-dashed border-[#B5822B]/50 bg-[#B5822B]/5 px-3 py-2.5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a6320]">
              Brief · légende en préparation
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#003219]/80">{post.brief}</p>
          </div>
        ) : (
          <p className="text-sm italic text-[#003219]/50">Légende en préparation.</p>
        )}

        {post.hashtags ? (
          <p className="mt-2 text-sm text-[#B5822B]">{post.hashtags}</p>
        ) : null}

        {post.link ? (
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-[#003219] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
          >
            Voir le lien
          </a>
        ) : null}

        {/* Decision buttons */}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            aria-pressed={approved}
            onClick={() => onDecision(APPROVED)}
            className={[
              "flex-1 rounded-full px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]",
              approved
                ? "bg-[#003219] text-[#FAF6EE]"
                : "border-2 border-[#003219] text-[#003219] hover:bg-[#003219]/5",
            ].join(" ")}
          >
            Approuver
          </button>
          <button
            type="button"
            aria-pressed={adjust}
            onClick={() => onDecision(ADJUST)}
            className={[
              "flex-1 rounded-full px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]",
              adjust
                ? "bg-[#B5822B] text-[#FAF6EE]"
                : "border-2 border-[#B5822B] text-[#8a6320] hover:bg-[#B5822B]/10",
            ].join(" ")}
          >
            À ajuster
          </button>
        </div>

        {/* Comment box */}
        <div className="mt-3">
          <label htmlFor={`comment-${post.id}`} className="sr-only">
            Commentaire pour ce post
          </label>
          <textarea
            id={`comment-${post.id}`}
            value={comment}
            onChange={(e) => onComment(e.target.value)}
            onBlur={() => {
              if (decision === APPROVED || decision === ADJUST) onDecision(decision)
            }}
            placeholder={
              adjust ? "Qu’est-ce que tu aimerais ajuster ?" : "Un commentaire (optionnel)…"
            }
            rows={adjust ? 3 : 2}
            className="w-full resize-y rounded-xl border border-[#003219]/15 bg-[#FAF6EE]/60 px-3 py-2 text-sm text-[#003219] placeholder:text-[#003219]/40 focus:border-[#B5822B] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#B5822B]"
          />
        </div>

        {/* Add a file: goes straight into this post's visuals in Airtable */}
        <UploadButton recordId={post.id} token={token} onUploaded={onUploaded} />

        {/* Save state */}
        <div className="mt-2 min-h-[1.25rem] text-sm" aria-live="polite">
          {saveState === "saving" ? (
            <span className="text-[#003219]/60">Enregistrement…</span>
          ) : saveState === "saved" ? (
            <span className="font-medium text-[#003219]">✓ Enregistré</span>
          ) : saveState === "error" ? (
            <span className="text-[#8a2b1f]">
              Pas enregistré.{" "}
              <button
                type="button"
                onClick={onRetry}
                className="font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
              >
                Réessayer
              </button>
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

// ---- Upload ------------------------------------------------------------------

// The server and Airtable accept up to 4 MB per file. Photos above that are
// resized in the browser first; videos and PDFs above it are refused here with
// a clear message.
const MAX_UPLOAD = 4 * 1024 * 1024

async function shrinkImage(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD || !file.type.startsWith("image/") || file.type === "image/gif") return file
  try {
    const bitmap = await createImageBitmap(file)
    for (const side of [3000, 2400, 1800]) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86))
      if (blob && blob.size <= MAX_UPLOAD) {
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" })
      }
    }
  } catch {
    // Format the browser can't decode (e.g. HEIC on Chrome): fall through.
  }
  return file
}

function UploadButton({
  recordId,
  token,
  onUploaded,
}: {
  recordId: string
  token: string
  onUploaded: (visuals: Visual[]) => void
}) {
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle")
  const [message, setMessage] = useState("")
  const inputId = `upload-${recordId}`

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setState("uploading")
    let count = 0
    for (const original of Array.from(files)) {
      setMessage(files.length > 1 ? `Envoi ${count + 1} sur ${files.length}…` : "Envoi du fichier…")
      const file = await shrinkImage(original)
      if (file.size > MAX_UPLOAD) {
        setState("error")
        setMessage(`« ${original.name} » dépasse 4 Mo. Envoie-le-moi sur WhatsApp.`)
        return
      }
      const form = new FormData()
      form.append("token", token)
      form.append("recordId", recordId)
      form.append("file", file)
      try {
        const res = await fetch("/api/upload", { method: "POST", body: form })
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; visuals?: Visual[]; error?: string }
        if (!res.ok || !data.ok) {
          setState("error")
          setMessage(
            data.error === "unsupported_type"
              ? "Format non accepté : photo, vidéo ou PDF seulement."
              : `« ${original.name} » n’a pas pu être ajouté. Réessaie.`,
          )
          return
        }
        if (data.visuals) onUploaded(data.visuals)
        count += 1
      } catch {
        setState("error")
        setMessage("Connexion perdue. Réessaie.")
        return
      }
    }
    setState("done")
    setMessage(count > 1 ? `✓ ${count} fichiers ajoutés` : "✓ Fichier ajouté")
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <label
        htmlFor={inputId}
        className={[
          "inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-[#003219]/35 px-4 py-2 text-sm font-medium text-[#003219] transition-colors hover:bg-[#003219]/5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#B5822B]",
          state === "uploading" ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        <span aria-hidden>📎</span> Ajouter un fichier
        <input
          id={inputId}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          className="sr-only"
          disabled={state === "uploading"}
          onChange={(e) => {
            void handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </label>
      {message ? (
        <span
          aria-live="polite"
          className={state === "error" ? "text-sm text-[#8a2b1f]" : "text-sm text-[#003219]/70"}
        >
          {message}
        </span>
      ) : null}
    </div>
  )
}

// ---- Visuals -----------------------------------------------------------------

// The card preview: every attachment of the post, in filename order, shown
// whole (never cropped). Images open full size in the lightbox; videos play
// inline.
function VisualGallery({ visuals, title }: { visuals: Visual[]; title: string }) {
  const [index, setIndex] = useState(0)
  const [lightboxAt, setLightboxAt] = useState<number | null>(null)

  if (visuals.length === 0) {
    return (
      <div className="flex items-center justify-center border-b border-dashed border-[#003219]/15 bg-[#003219]/[0.03] px-4 py-7 text-center text-sm text-[#003219]/45">
        Visuel à venir 🌿
      </div>
    )
  }

  const safeIndex = Math.min(index, visuals.length - 1)
  const current = visuals[safeIndex]
  const many = visuals.length > 1
  const label = `Visuel${many ? ` ${safeIndex + 1} sur ${visuals.length}` : ""} — ${title}`

  return (
    <div className="border-b border-[#003219]/10 bg-[#003219]/[0.04]">
      <div className="relative">
        {current.kind === "video" ? (
          <video
            key={current.id}
            src={current.url}
            poster={current.preview ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="mx-auto block max-h-[28rem] w-full bg-black object-contain"
          >
            <a href={current.url}>Ouvrir la vidéo</a>
          </video>
        ) : (
          <button
            type="button"
            onClick={() => setLightboxAt(safeIndex)}
            className="group block w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#B5822B]"
            aria-label={`Agrandir : ${label}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.preview ?? current.url}
              alt={label}
              className="mx-auto block max-h-[28rem] w-auto max-w-full object-contain"
              loading="lazy"
            />
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-[#003219]/85 px-2.5 py-1 text-xs font-medium text-[#FAF6EE] opacity-90">
              Voir en grand
            </span>
          </button>
        )}

        {many ? (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-[#003219]/85 px-2.5 py-1 text-xs font-medium text-[#FAF6EE]">
            {safeIndex + 1}/{visuals.length}
          </span>
        ) : null}
      </div>

      {many ? (
        <div className="flex gap-2 overflow-x-auto px-3 py-2">
          {visuals.map((visual, i) => (
            <button
              key={visual.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Voir le visuel ${i + 1} sur ${visuals.length}`}
              aria-current={i === safeIndex}
              className={[
                "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-[#003219]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]",
                i === safeIndex ? "border-[#B5822B]" : "border-transparent opacity-70",
              ].join(" ")}
            >
              <span className="relative block h-full w-full">
                {visual.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={visual.preview}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                {visual.kind === "video" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-[#003219]/35 text-sm text-[#FAF6EE]">
                    ▶
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {lightboxAt !== null ? (
        <Lightbox
          visuals={visuals}
          startAt={lightboxAt}
          title={title}
          onClose={() => setLightboxAt(null)}
        />
      ) : null}
    </div>
  )
}

// Full-screen viewer: the original file, at its real size, with arrows when the
// post carries several slides.
function Lightbox({
  visuals,
  startAt,
  title,
  onClose,
}: {
  visuals: Visual[]
  startAt: number
  title: string
  onClose: () => void
}) {
  const [index, setIndex] = useState(startAt)
  const many = visuals.length > 1

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowRight") setIndex((i) => (i + 1) % visuals.length)
      if (event.key === "ArrowLeft") setIndex((i) => (i - 1 + visuals.length) % visuals.length)
    }
    document.addEventListener("keydown", onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, visuals.length])

  if (typeof document === "undefined") return null

  const current = visuals[index]

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Visuel — ${title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#00150c] p-3 sm:p-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-3 top-3 z-10 rounded-full bg-[#FAF6EE]/15 px-3 py-2 text-sm font-medium text-[#FAF6EE] hover:bg-[#FAF6EE]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
      >
        Fermer ✕
      </button>

      {many ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIndex((i) => (i - 1 + visuals.length) % visuals.length)
            }}
            aria-label="Visuel précédent"
            className="absolute left-2 z-10 rounded-full bg-[#FAF6EE]/15 px-3 py-4 text-lg text-[#FAF6EE] hover:bg-[#FAF6EE]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B] sm:left-4"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIndex((i) => (i + 1) % visuals.length)
            }}
            aria-label="Visuel suivant"
            className="absolute right-2 z-10 rounded-full bg-[#FAF6EE]/15 px-3 py-4 text-lg text-[#FAF6EE] hover:bg-[#FAF6EE]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B] sm:right-4"
          >
            ›
          </button>
        </>
      ) : null}

      <div
        className="flex max-h-full max-w-full flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {current.kind === "video" ? (
          <video
            key={current.id}
            src={current.url}
            poster={current.preview ?? undefined}
            controls
            autoPlay
            playsInline
            className="max-h-[82vh] max-w-full object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={`Visuel ${index + 1} sur ${visuals.length} — ${title}`}
            className="max-h-[82vh] max-w-full object-contain"
          />
        )}

        <div className="flex items-center gap-4 text-xs text-[#FAF6EE]/70">
          {many ? (
            <span>
              {index + 1} / {visuals.length}
            </span>
          ) : null}
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-[#FAF6EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
          >
            Ouvrir le fichier original
          </a>
        </div>
      </div>
    </div>,
    document.body,
  )
}
