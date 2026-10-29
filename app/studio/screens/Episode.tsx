"use client"

import { useState, type ReactNode } from "react"
import { ArrowLeft, ArrowRight, Check, Monitor, Plus, RefreshCw, Settings, Smartphone, Sparkles, UserRound } from "lucide-react"
import type { AvatarLook, AvatarStyle, EpisodeLang, Format, Lang, PastEpisode, PlanQuestion, StudioProfile } from "@/lib/studio/types"
import type { Topic } from "@/lib/studio/topics"
import { fill, type UiCopy } from "../copy"
import { Button, Card, IconButton, SectionLabel, Segmented, Skeleton, Toggle, cx, display, inputCls } from "../ui"
import AvatarPreview from "./AvatarPreview"

function TopBar({ onBack, backLabel, right }: { onBack?: () => void; backLabel: string; right?: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-[var(--ava-ink)]/70 hover:bg-[var(--ava-ink)]/[0.06]"
        >
          <ArrowLeft size={20} />
        </button>
      ) : (
        <span />
      )}
      {right}
    </div>
  )
}

// ---- Home ---------------------------------------------------------------------

export function Home({
  t,
  name,
  look,
  portrait,
  avatarStyle,
  episodes,
  onNew,
  onProfile,
  onSettings,
  showName,
}: {
  t: UiCopy
  name: string
  look: AvatarLook
  portrait: string | null
  avatarStyle: AvatarStyle
  episodes: PastEpisode[]
  onNew: () => void
  onProfile: () => void
  onSettings: () => void
  showName: string
}) {
  return (
    <div className="mx-auto max-w-xl px-6 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))] animate-in fade-in duration-500">
      <TopBar
        backLabel=""
        right={
          <div className="flex gap-1">
            <IconButton label={t.editProfile} onClick={onProfile} tone="plain">
              <UserRound size={20} />
            </IconButton>
            <IconButton label={t.settings} onClick={onSettings} tone="plain">
              <Settings size={20} />
            </IconButton>
          </div>
        }
      />
      <p className="mt-4 text-sm text-[var(--ava-ink)]/45">{showName}</p>
      <h1 className="mt-1 text-4xl text-[var(--ava-ink)]" style={display}>
        {fill(t.hello, { name })}
      </h1>
      <p className="mt-2 text-[var(--ava-ink)]/60">{t.homeText}</p>

      <button
        type="button"
        onClick={onNew}
        className="group relative mt-8 w-full overflow-hidden rounded-[28px] bg-[var(--ava-ink)] p-6 text-left text-[var(--ava-cream)] shadow-[0_24px_60px_-24px_rgba(232,56,79,0.55)] transition hover:-translate-y-0.5 active:scale-[0.99]"
      >
        <span className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(240,106,106,0.35),transparent_68%)] transition group-hover:scale-110" />
        <div className="relative flex items-center gap-5">
          <AvatarPreview look={look} portrait={portrait} avatarStyle={avatarStyle} size={56} />
          <div className="flex-1">
            <p className="text-2xl font-semibold" style={display}>
              {t.newEpisode}
            </p>
            <p className="mt-1 text-sm text-[var(--ava-cream)]/70">{t.newEpisodeText}</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ava-coral)] to-[var(--ava-crimson)] text-white transition group-hover:translate-x-0.5">
            <ArrowRight size={20} />
          </span>
        </div>
      </button>

      <div className="mt-12">
        <SectionLabel>{t.yourEpisodes}</SectionLabel>
        {episodes.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-[var(--ava-ink)]/10 px-5 py-8 text-center text-sm text-[var(--ava-ink)]/45">{t.noEpisodes}</p>
        ) : (
          <ul className="space-y-2">
            {[...episodes]
              .reverse()
              .slice(0, 12)
              .map((e) => (
                <li key={e.id} className="rounded-2xl bg-white px-5 py-4 ring-1 ring-[var(--ava-ink)]/[0.05]">
                  <p className="text-xs tabular-nums text-[var(--ava-ink)]/40">{e.date}</p>
                  <p className="mt-1 font-semibold text-[var(--ava-ink)]">{e.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--ava-ink)]/55">{e.summary}</p>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ---- Topic ----------------------------------------------------------------------

export type TopicChoice = { kind: "topic"; id: string } | { kind: "series"; id: string }

export function TopicScreen({
  t,
  uiLang,
  topics,
  profile,
  choice,
  onChoice,
  note,
  onNote,
  epLang,
  onLang,
  format,
  onFormat,
  ai,
  busy,
  onBack,
  onContinue,
}: {
  t: UiCopy
  uiLang: Lang
  topics: Topic[]
  profile: StudioProfile
  choice: TopicChoice
  onChoice: (c: TopicChoice) => void
  note: string
  onNote: (v: string) => void
  epLang: EpisodeLang
  onLang: (v: EpisodeLang) => void
  format: Format
  onFormat: (f: Format) => void
  ai: boolean
  busy: boolean
  onBack: () => void
  onContinue: () => void
}) {
  const tile = (selected: boolean) =>
    cx(
      "relative min-h-24 rounded-2xl p-4 text-left transition active:scale-[0.99]",
      selected ? "bg-[var(--ava-ink)] text-[var(--ava-cream)]" : "bg-white text-[var(--ava-ink)] ring-1 ring-[var(--ava-ink)]/[0.06] hover:ring-[var(--ava-ink)]/20",
    )

  if (busy) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 animate-in fade-in">
        <div className="mb-6 flex items-center gap-3 text-[var(--ava-crimson)]">
          <Sparkles size={20} className="animate-pulse" />
          <p className="text-lg" style={display}>
            {t.preparing}
          </p>
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-6 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))] animate-in fade-in duration-300">
      <TopBar onBack={onBack} backLabel={t.back} />
      <h1 className="mt-2 text-3xl leading-tight text-[var(--ava-ink)] sm:text-4xl" style={display}>
        {t.topicTitle}
      </h1>

      <div className="mt-8">
        <SectionLabel>{t.topics}</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {topics.map((tp) => {
            const selected = choice.kind === "topic" && choice.id === tp.id
            return (
              <button key={tp.id} type="button" className={tile(selected)} onClick={() => onChoice({ kind: "topic", id: tp.id })}>
                {selected && <Check size={16} className="absolute right-3 top-3" />}
                <span className="block pr-5 font-semibold">{tp.title[uiLang]}</span>
                <span className={cx("mt-1 block text-xs leading-snug", selected ? "text-[var(--ava-cream)]/65" : "text-[var(--ava-ink)]/50")}>
                  {tp.blurb[uiLang]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {profile.themes.length > 0 && (
        <div className="mt-8">
          <SectionLabel>{t.series}</SectionLabel>
          <div className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none]">
            {profile.themes.map((th) => {
              const selected = choice.kind === "series" && choice.id === th.id
              return (
                <button
                  key={th.id}
                  type="button"
                  className={cx(tile(selected), "w-52 shrink-0 snap-start")}
                  onClick={() => onChoice({ kind: "series", id: th.id })}
                >
                  {selected && <Check size={16} className="absolute right-3 top-3" />}
                  <span className="block pr-5 text-sm font-semibold">{th.title[uiLang]}</span>
                  <span className={cx("mt-1 block text-xs leading-snug", selected ? "text-[var(--ava-cream)]/65" : "text-[var(--ava-ink)]/50")}>
                    {th.blurb[uiLang]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {ai && choice.kind === "topic" && (
        <div className="mt-8">
          <SectionLabel>
            {t.noteLabel} <span className="normal-case tracking-normal text-[var(--ava-ink)]/30">· {t.optional}</span>
          </SectionLabel>
          <textarea rows={2} value={note} placeholder={t.notePlaceholder} onChange={(e) => onNote(e.target.value)} className={cx(inputCls, "resize-none")} />
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <SectionLabel>{t.language}</SectionLabel>
          <Segmented
            full
            value={epLang}
            options={[
              { value: "fr", label: "FR" },
              { value: "en", label: "EN" },
              { value: "mix", label: "FR + EN" },
            ]}
            onChange={onLang}
          />
        </div>
        <div>
          <SectionLabel>{t.format}</SectionLabel>
          <Segmented
            full
            value={format}
            options={[
              {
                value: "vertical",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Smartphone size={15} /> 9:16
                  </span>
                ),
              },
              {
                value: "horizontal",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Monitor size={15} /> 16:9
                  </span>
                ),
              },
            ]}
            onChange={onFormat}
          />
          <p className="mt-2 text-xs text-[var(--ava-ink)]/40">{format === "vertical" ? t.verticalHint : t.horizontalHint}</p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[var(--ava-paper)] via-[var(--ava-paper)]/95 to-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
        <div className="mx-auto max-w-xl">
          <Button size="lg" className="w-full" onClick={onContinue}>
            {choice.kind === "topic" && ai && <Sparkles size={18} />}
            {t.prepare}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---- Plan ------------------------------------------------------------------------

export function PlanScreen({
  t,
  questions,
  enabled,
  onToggle,
  onAdd,
  includeClosing,
  onClosing,
  closingText,
  langFor,
  notice,
  canRegenerate,
  onRegenerate,
  onBack,
  onContinue,
}: {
  t: UiCopy
  questions: PlanQuestion[]
  enabled: Record<string, boolean>
  onToggle: (id: string) => void
  onAdd: (text: string) => void
  includeClosing: boolean
  onClosing: (v: boolean) => void
  closingText: string
  langFor: (i: number) => Lang
  notice: string
  canRegenerate: boolean
  onRegenerate: () => void
  onBack: () => void
  onContinue: () => void
}) {
  const [custom, setCustom] = useState("")
  const count = questions.filter((q) => enabled[q.id] !== false).length + (includeClosing ? 1 : 0)
  // Roughly two minutes per question with follow-ups.
  const minutes = Math.max(2, Math.round(count * 2))
  let shown = 0

  const add = () => {
    if (!custom.trim()) return
    onAdd(custom.trim())
    setCustom("")
  }

  return (
    <div className="mx-auto max-w-xl px-6 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))] animate-in fade-in slide-in-from-bottom-2 duration-300">
      <TopBar
        onBack={onBack}
        backLabel={t.back}
        right={
          canRegenerate && (
            <Button variant="ghost" onClick={onRegenerate}>
              <RefreshCw size={16} />
              {t.regenerate}
            </Button>
          )
        }
      />
      <h1 className="mt-2 text-3xl text-[var(--ava-ink)] sm:text-4xl" style={display}>
        {t.planTitle}
      </h1>
      <p className="mt-2 text-sm text-[var(--ava-ink)]/55">
        {fill(t.planMeta, { n: count, m: minutes })} · {t.planHint}
      </p>
      {notice && <p className="mt-4 rounded-2xl bg-[var(--ava-crimson)]/10 px-4 py-3 text-sm text-[var(--ava-crimson)]">{notice}</p>}

      <ol className="mt-6 space-y-2">
        {questions.map((q) => {
          const on = enabled[q.id] !== false
          const lang = langFor(on ? shown : 0)
          if (on) shown += 1
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onToggle(q.id)}
                aria-pressed={on}
                className={cx(
                  "flex w-full items-start gap-4 rounded-2xl p-4 text-left transition",
                  on ? "bg-white ring-1 ring-[var(--ava-ink)]/[0.06]" : "bg-transparent opacity-40 ring-1 ring-dashed ring-[var(--ava-ink)]/10",
                )}
              >
                <span
                  className={cx(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    on ? "bg-[var(--ava-crimson)] text-[var(--ava-cream)]" : "ring-1 ring-[var(--ava-ink)]/30",
                  )}
                >
                  {on ? shown : ""}
                </span>
                <span className="flex-1 leading-snug text-[var(--ava-ink)]">
                  {q.text[lang]}
                  {q.deep && (
                    <span className="ml-2 inline-block rounded-full bg-[var(--ava-blush)] px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-[var(--ava-crimson-deep)]">
                      {t.deep}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="mt-3 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t.addQuestion}
          className={inputCls}
        />
        <IconButton label={t.add} onClick={add} tone="plain" className="h-[52px] w-[52px] bg-white ring-1 ring-[var(--ava-line)]">
          <Plus size={20} />
        </IconButton>
      </div>

      <Card className="mt-6">
        <Toggle label={t.closing} checked={includeClosing} onChange={onClosing} />
        <p className="text-sm text-[var(--ava-ink)]/55">{closingText}</p>
      </Card>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[var(--ava-paper)] via-[var(--ava-paper)]/95 to-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
        <div className="mx-auto max-w-xl">
          <Button size="lg" className="w-full" disabled={count === 0} onClick={onContinue}>
            {t.openCamera}
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
