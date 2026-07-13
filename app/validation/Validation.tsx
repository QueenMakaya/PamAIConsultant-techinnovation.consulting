"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

// ---- Types (mirror the /api/calendar response) ------------------------------

type Post = {
  id: string
  title: string
  date: string
  channel: string
  format: string
  caption: string
  hashtags: string
  link: string
  visual: string | null
  approval: string
  comment: string
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
  const t = Date.parse(value)
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

export default function Validation() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [status, setStatus] = useState<"loading" | "unauth" | "error" | "ready">("loading")
  const [beats, setBeats] = useState<Beat[]>([])

  // Per-record UI state, keyed by record id.
  const [decisions, setDecisions] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({})
  const [copied, setCopied] = useState(false)

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
      const data = (await res.json()) as { beats: Beat[] }
      const nextBeats = data.beats ?? []
      setBeats(nextBeats)

      // Seed decisions / comments from Airtable's current values.
      const seedDecisions: Record<string, string> = {}
      const seedComments: Record<string, string> = {}
      for (const beat of nextBeats) {
        for (const post of beat.posts) {
          if (post.approval === APPROVED || post.approval === ADJUST) {
            seedDecisions[post.id] = post.approval
          }
          seedComments[post.id] = post.comment ?? ""
        }
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

  const allPosts = useMemo(() => beats.flatMap((b) => b.posts), [beats])
  const total = allPosts.length
  const decided = useMemo(
    () => allPosts.filter((p) => decisions[p.id] === APPROVED || decisions[p.id] === ADJUST).length,
    [allPosts, decisions],
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

  const buildSummary = useCallback(() => {
    const lines: string[] = ["Mes retours sur le calendrier 🌿", ""]
    for (const beat of beats) {
      const reviewed = beat.posts.filter(
        (p) => decisions[p.id] === APPROVED || decisions[p.id] === ADJUST,
      )
      if (reviewed.length === 0) continue
      lines.push(beat.title)
      for (const post of reviewed) {
        const mark = decisions[post.id] === APPROVED ? "✅ Approuvé" : "✏️ À ajuster"
        const suffix = post.channel ? ` (${post.channel})` : ""
        lines.push(`• ${mark}${suffix}`)
        const note = comments[post.id]?.trim()
        if (note && decisions[post.id] === ADJUST) lines.push(`   ↳ ${note}`)
      }
      lines.push("")
    }
    return lines.join("\n").trim()
  }, [beats, decisions, comments])

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

  if (total === 0) {
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

  const done = decided === total

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
              Validation du calendrier
            </p>
            <p className="text-sm text-[#003219]/70">
              {done ? (
                <span className="font-medium text-[#003219]">Tout est passé en revue — merci 🌿</span>
              ) : (
                <>
                  <span className="font-semibold text-[#003219]">{decided}</span> sur {total} posts
                  validés
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

      {/* Beats */}
      <div className="space-y-10">
        {beats.map((beat) => (
          <section key={beat.key} aria-labelledby={`beat-${beat.key}`}>
            <div className="mb-3 flex items-baseline gap-2">
              <span
                className="text-sm font-bold text-[#B5822B]"
                style={{ fontFamily: "var(--font-fraunces), serif" }}
              >
                {beat.key === "—" ? "•" : beat.key}
              </span>
              <h2
                id={`beat-${beat.key}`}
                className="text-xl text-[#003219]"
                style={{ fontFamily: "var(--font-fraunces), serif" }}
              >
                {beat.title.replace(/^\s*0*\d+\s*[—–-]\s*/, "") || beat.title}
              </h2>
            </div>

            <div className="space-y-4">
              {beat.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  decision={decisions[post.id] ?? ""}
                  comment={comments[post.id] ?? ""}
                  saveState={saveStates[post.id] ?? "idle"}
                  onComment={(value) => setComments((c) => ({ ...c, [post.id]: value }))}
                  onDecision={(decision) => void save(post, decision)}
                  onRetry={() => void save(post, decisions[post.id] ?? APPROVED)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Summary / share */}
      <div className="mt-12 rounded-2xl border border-[#003219]/10 bg-white/60 p-5">
        <h2
          className="text-lg text-[#003219]"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Partager mes retours
        </h2>
        <p className="mt-1 text-sm text-[#003219]/70">
          Un récap de tes décisions, prêt à m’envoyer.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-full border-2 border-[#003219] px-5 py-2.5 text-sm font-medium text-[#003219] transition-colors hover:bg-[#003219] hover:text-[#FAF6EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
          >
            {copied ? "Copié ✓" : "Copier mes retours"}
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#003219] px-5 py-2.5 text-sm font-medium text-[#FAF6EE] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
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
}: {
  post: Post
  decision: string
  comment: string
  saveState: SaveState
  onComment: (value: string) => void
  onDecision: (decision: string) => void
  onRetry: () => void
}) {
  const ch = channelStyle(post.channel)
  const approved = decision === APPROVED
  const adjust = decision === ADJUST

  return (
    <article className="overflow-hidden rounded-2xl border border-[#003219]/10 bg-white/70 shadow-sm">
      {post.visual ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.visual}
          alt={`Visuel — ${post.title}`}
          className="max-h-80 w-full object-cover"
          loading="lazy"
        />
      ) : null}

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
          {post.date ? (
            <span className="ml-auto text-xs text-[#003219]/60">{formatDate(post.date)}</span>
          ) : null}
        </div>

        {post.caption ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#003219]">
            {post.caption}
          </p>
        ) : null}

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
