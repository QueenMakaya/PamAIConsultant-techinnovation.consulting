"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

// ---- Types (mirror /api/admin/overview) -------------------------------------

type PostRef = {
  id: string
  title: string
  date: string
  channel: string
  comment: string
  airtableUrl: string
}

type Summary = {
  awaiting: number
  toFix: number
  approvedToSchedule: number
  scheduled: number
  published: number
  overdue: number
  dueSoon: number
  nextDate: string | null
}

type BusinessOverview = {
  slug: string
  name: string
  kind: "client" | "own"
  approverName: string
  approverEmail: string
  reminders: boolean
  metricoolBrand: string
  portalUrl: string | null
  airtableUrl: string
  summary: Summary | null
  error: string | null
  toFix: PostRef[]
  approvedToSchedule: PostRef[]
  awaiting: PostRef[]
  overdue: PostRef[]
}

type Overview = {
  today: string
  source: "registry" | "legacy"
  email: boolean
  registryUrl: string
  templateUrl: string
  businesses: BusinessOverview[]
}

type Filter = "all" | "client" | "own" | "action"

const PINE = "#003219"
const HONEY = "#B5822B"
const serif = { fontFamily: "var(--font-fraunces), serif" }

function frDate(iso: string | null): string {
  if (!iso) return "—"
  const t = Date.parse(`${iso}T12:00:00Z`)
  if (Number.isNaN(t)) return iso
  return new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(t))
}

function needsAction(b: BusinessOverview): boolean {
  return Boolean(b.error) || b.toFix.length + b.approvedToSchedule.length + b.overdue.length > 0
}

// ---- Pieces -----------------------------------------------------------------

function Stat({ label, value, tone }: { label: string; value: number; tone: "pine" | "honey" | "alert" | "muted" }) {
  const color = tone === "alert" ? "#a33a2a" : tone === "honey" ? HONEY : tone === "muted" ? "#00321999" : PINE
  return (
    <div className="rounded-2xl border border-[#003219]/10 bg-white/70 px-4 py-3">
      <div className="text-3xl tabular-nums" style={{ ...serif, color }}>
        {value}
      </div>
      <div className="mt-1 text-sm text-[#003219]/70">{label}</div>
    </div>
  )
}

function Pill({ n, label, tone }: { n: number; label: string; tone: "pine" | "honey" | "alert" | "muted" }) {
  if (n === 0 && tone !== "pine") return null
  const styles: Record<string, string> = {
    pine: "bg-[#003219] text-[#FAF6EE]",
    honey: "bg-[#B5822B] text-[#FAF6EE]",
    alert: "bg-[#a33a2a] text-white",
    muted: "bg-[#e7ddc9] text-[#003219]",
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${styles[tone]}`}>
      {n} {label}
    </span>
  )
}

function PostList({ title, posts, showComment }: { title: string; posts: PostRef[]; showComment?: boolean }) {
  if (posts.length === 0) return null
  return (
    <div className="mt-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#003219]/60">{title}</h4>
      <ul className="space-y-1.5">
        {posts.slice(0, 8).map((p) => (
          <li key={p.id} className="text-sm leading-snug">
            <a
              href={p.airtableUrl}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[#B5822B]/50 underline-offset-2 hover:decoration-[#B5822B]"
            >
              <span className="tabular-nums text-[#003219]/60">{frDate(p.date)}</span> · {p.title || "Sans titre"}
            </a>
            {p.channel ? <span className="text-[#003219]/50"> ({p.channel})</span> : null}
            {showComment && p.comment ? (
              <p className="mt-0.5 border-l-2 border-[#B5822B] pl-2 text-[#003219]/75">{p.comment}</p>
            ) : null}
          </li>
        ))}
        {posts.length > 8 ? <li className="text-sm text-[#003219]/50">… et {posts.length - 8} autre(s)</li> : null}
      </ul>
    </div>
  )
}

function BusinessCard({ b }: { b: BusinessOverview }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const s = b.summary
  const hasDetails = b.toFix.length + b.approvedToSchedule.length + b.overdue.length + b.awaiting.length > 0

  const copy = async () => {
    if (!b.portalUrl) return
    try {
      await navigator.clipboard.writeText(b.portalUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked: the link is still clickable */
    }
  }

  return (
    <article className="rounded-3xl border border-[#003219]/10 bg-white/80 p-5 shadow-[0_1px_0_rgba(0,50,25,0.04)]">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-xl" style={serif}>
            {b.name}
          </h3>
          <p className="text-xs text-[#003219]/60">
            {b.kind === "own" ? "Mon entreprise" : "Client"}
            {b.approverName ? ` · approbation : ${b.approverName}` : ""}
            {s?.nextDate ? ` · prochaine publication ${frDate(s.nextDate)}` : ""}
          </p>
        </div>
        {!b.approverEmail || !b.reminders ? (
          <span className="rounded-full border border-[#003219]/15 px-2 py-0.5 text-[11px] text-[#003219]/60">
            {b.reminders ? "pas de courriel" : "rappels off"}
          </span>
        ) : null}
      </header>

      {b.error ? (
        <p className="mt-3 rounded-xl bg-[#a33a2a]/10 px-3 py-2 text-sm text-[#a33a2a]">
          Lecture impossible : {b.error}
        </p>
      ) : s ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Pill n={s.awaiting} label="à valider" tone="pine" />
          <Pill n={s.toFix} label="à ajuster" tone="honey" />
          <Pill n={s.approvedToSchedule} label="à programmer" tone="muted" />
          <Pill n={s.overdue} label="en retard" tone="alert" />
          {s.scheduled ? <span className="px-1 text-xs text-[#003219]/60">{s.scheduled} programmées</span> : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {b.portalUrl ? (
          <>
            <a
              href={b.portalUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#003219] px-4 py-2 font-medium text-[#FAF6EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
            >
              Portail
            </a>
            <button
              type="button"
              onClick={() => void copy()}
              className="rounded-full border border-[#003219]/20 px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
            >
              {copied ? "Lien copié ✓" : "Copier le lien"}
            </button>
          </>
        ) : (
          <span className="rounded-full border border-dashed border-[#003219]/25 px-4 py-2 text-[#003219]/60">
            Aucun jeton : ajoute-le dans le registre
          </span>
        )}
        <a
          href={b.airtableUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-[#003219]/20 px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
        >
          Airtable
        </a>
        {hasDetails ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="ml-auto rounded-full px-3 py-2 text-[#003219]/70 underline underline-offset-2"
          >
            {open ? "Masquer" : "Détails"}
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-2 border-t border-[#003219]/10 pt-2">
          <PostList title="Ajustements demandés" posts={b.toFix} showComment />
          <PostList title="Approuvées · à programmer" posts={b.approvedToSchedule} />
          <PostList title="En retard" posts={b.overdue} />
          <PostList title="En attente de validation" posts={b.awaiting} />
        </div>
      ) : null}
    </article>
  )
}

// ---- Page -------------------------------------------------------------------

export default function AdminDashboard() {
  const params = useSearchParams()
  const key = params.get("key") ?? ""
  const [state, setState] = useState<"loading" | "unauth" | "error" | "ready">("loading")
  const [data, setData] = useState<Overview | null>(null)
  const [filter, setFilter] = useState<Filter>("all")

  const load = useCallback(async () => {
    setState("loading")
    try {
      const res = await fetch(`/api/admin/overview?key=${encodeURIComponent(key)}`, { cache: "no-store" })
      if (res.status === 401) return setState("unauth")
      if (!res.ok) return setState("error")
      setData((await res.json()) as Overview)
      setState("ready")
    } catch {
      setState("error")
    }
  }, [key])

  useEffect(() => {
    void load()
  }, [load])

  const totals = useMemo(() => {
    const t = { awaiting: 0, toFix: 0, approvedToSchedule: 0, overdue: 0 }
    for (const b of data?.businesses ?? []) {
      if (!b.summary) continue
      t.awaiting += b.summary.awaiting
      t.toFix += b.summary.toFix
      t.approvedToSchedule += b.summary.approvedToSchedule
      t.overdue += b.summary.overdue
    }
    return t
  }, [data])

  const visible = useMemo(() => {
    const list = data?.businesses ?? []
    const filtered = list.filter((b) =>
      filter === "all" ? true : filter === "action" ? needsAction(b) : b.kind === filter,
    )
    // Businesses needing action first, then alphabetical.
    return [...filtered].sort(
      (a, b) => Number(needsAction(b)) - Number(needsAction(a)) || a.name.localeCompare(b.name, "fr"),
    )
  }, [data, filter])

  if (state === "loading") {
    return <Centered>Le tableau de bord se charge…</Centered>
  }
  if (state === "unauth") {
    return <Centered>Clé admin manquante ou invalide.</Centered>
  }
  if (state === "error" || !data) {
    return (
      <Centered>
        <span>Impossible de charger les données.</span>{" "}
        <button type="button" className="underline" onClick={() => void load()}>
          Réessayer
        </button>
      </Centered>
    )
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Toutes" },
    { id: "action", label: "À traiter" },
    { id: "client", label: "Clients" },
    { id: "own", label: "Mes entreprises" },
  ]

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B5822B]">Content Ops</p>
          <h1 className="text-3xl sm:text-4xl" style={serif}>
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-[#003219]/60">
            {data.businesses.length} entreprises · {frDate(data.today)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-[#003219]/20 px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B]"
        >
          Actualiser
        </button>
      </header>

      {data.source === "legacy" || !data.email ? (
        <div className="mb-6 space-y-1 rounded-2xl border border-[#B5822B]/40 bg-[#B5822B]/10 px-4 py-3 text-sm">
          {data.source === "legacy" ? (
            <p>
              Le registre Airtable n’est pas lisible : seules les anciennes entreprises s’affichent. Donne au jeton
              Airtable l’accès à la base « Content Ops · Registre des entreprises ».
            </p>
          ) : null}
          {!data.email ? (
            <p>Les courriels automatiques sont en pause : ajoute RESEND_API_KEY, EMAIL_FROM et NOTIFY_EMAIL dans Vercel.</p>
          ) : null}
        </div>
      ) : null}

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="à valider par les clients" value={totals.awaiting} tone="pine" />
        <Stat label="ajustements demandés" value={totals.toFix} tone="honey" />
        <Stat label="approuvées à programmer" value={totals.approvedToSchedule} tone="muted" />
        <Stat label="en retard" value={totals.overdue} tone="alert" />
      </section>

      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filtrer">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`rounded-full px-4 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5822B] ${
              filter === f.id ? "bg-[#003219] text-[#FAF6EE]" : "border border-[#003219]/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </nav>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((b) => (
          <BusinessCard key={b.slug} b={b} />
        ))}
        {visible.length === 0 ? <p className="text-[#003219]/60">Rien à traiter 🌿</p> : null}
      </section>

      <footer className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#003219]/70">
        <a href={data.registryUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Registre des entreprises
        </a>
        <a href={data.templateUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Modèle de base à dupliquer
        </a>
      </footer>
    </main>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 text-center text-lg text-[#003219]/70" style={serif}>
      <p>{children}</p>
    </div>
  )
}
