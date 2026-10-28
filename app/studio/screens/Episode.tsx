"use client"

import { useState, type ReactNode } from "react"
import { ArrowLeft, ArrowRight, Check, Monitor, Plus, RefreshCw, Settings, Smartphone, Sparkles, UserRound } from "lucide-react"
import type { AvatarLook, EpisodeLang, Format, Lang, PastEpisode, PlanQuestion, StudioProfile } from "@/lib/studio/types"
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
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-[#F7F3EA]/70 hover:bg-white/[0.06]"
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
            <IconButton label={t.editProfile} onClick={onProfile} className="bg-transparent hover:bg-white/[0.06]">
              <UserRound size={20} />
            </IconButton>
            <IconButton label={t.settings} onClick={onSettings} className="bg-transparent hover:bg-white/[0.06]">
              <Settings size={20} />
            </IconButton>
          </div>
        }
      />
      <p className="mt-4 text-sm text-[#F7F3EA]/45">{showName}</p>
      <h1 className="mt-1 text-4xl text-[#F7F3EA]" style={display}>
        {fill(t.hello, { name })}
      </h1>
      <p className="mt-2 text-[#F7F3EA]/60">{t.homeText}</p>

      <button
        type="button"
        onClick={onNew}
        className="group relative mt-8 w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#F2C14E] via-[#E9A93A] to-[#C9822B] p-6 text-left text-[#14110A] shadow-[0_20px_60px_-20px_rgba(242,193,78,0.6)] transition active:scale-[0.99]"
      >
        <span className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-2xl transition group-hover:scale-110" />
        <div className="relative flex items-center gap-5">
          <div className="rounded-full ring-4 ring-[#14110A]/10">
            <AvatarPreview look={look} portrait={portrait} size={72} />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-semibold" style={display}>
              {t.newEpisode}
            </p>
            <p className="mt-1 text-sm text-[#14110A]/70">{t.newEpisodeText}</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#14110A] text-[#F2C14E] transition group-hover:translate-x-0.5">
            <ArrowRight size={20} />
          </span>
        </div>
      </button>

      <div className="mt-12">
        <SectionLabel>{t.yourEpisodes}</SectionLabel>
        {episodes.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-[#F7F3EA]/45">{t.noEpisodes}</p>
        ) : (
          <ul className="space-y-2">
            {[...episodes]
              .reverse()
              .slice(0, 12)
              .map((e) => (
                <li key={e.id} className="rounded-2xl bg-[#131A16] px-5 py-4 ring-1 ring-white/[0.05]">
                  <p className="text-xs tabular-nums text-[#F7F3EA]/40">{e.date}</p>
                  <p className="mt-1 font-semibold text-[#F7F3EA]">{e.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[#F7F3EA]/55">{e.summary}</p>
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
      selected ? "bg-[#F7F3EA] text-[#14110A]" : "bg-[#131A16] text-[#F7F3EA] ring-1 ring-white/[0.06] hover:ring-white/20",
    )

  if (busy) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 animate-in fade-in">
        <div className="mb-6 flex items-center gap-3 text-[#F2C14E]">
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
      <h1 className="mt-2 text-3xl leading-tight text-[#F7F3EA] sm:text-4xl" style={display}>
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
                <span className={cx("mt-1 block text-xs leading-snug", selected ? "text-[#14110A]/65" : "text-[#F7F3EA]/50")}>
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
                  <span className={cx("mt-1 block text-xs leading-snug", selected ? "text-[#14110A]/65" : "text-[#F7F3EA]/50")}>
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
            {t.noteLabel} <span className="normal-case tracking-normal text-[#F7F3EA]/30">· {t.optional}</span>
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
          <p className="mt-2 text-xs text-[#F7F3EA]/40">{format === "vertical" ? t.verticalHint : t.horizontalHint}</p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[#0B0F0D] via-[#0B0F0D]/95 to-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
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
      <h1 className="mt-2 text-3xl text-[#F7F3EA] sm:text-4xl" style={display}>
        {t.planTitle}
      </h1>
      <p className="mt-2 text-sm text-[#F7F3EA]/55">
        {fill(t.planMeta, { n: count, m: minutes })} · {t.planHint}
      </p>
      {notice && <p className="mt-4 rounded-2xl bg-[#F2C14E]/10 px-4 py-3 text-sm text-[#F2C14E]">{notice}</p>}

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
                  on ? "bg-[#131A16] ring-1 ring-white/[0.06]" : "bg-transparent opacity-40 ring-1 ring-dashed ring-white/10",
                )}
              >
                <span
                  className={cx(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    on ? "bg-[#F2C14E] text-[#14110A]" : "ring-1 ring-white/30",
                  )}
                >
                  {on ? shown : ""}
                </span>
                <span className="flex-1 leading-snug text-[#F7F3EA]">
                  {q.text[lang]}
                  {q.deep && (
                    <span className="ml-2 inline-block rounded-full bg-[#B04A6A]/30 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-[#F3B8C9]">
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
        <IconButton label={t.add} onClick={add} className="h-[52px] w-[52px] bg-white/[0.08]">
          <Plus size={20} />
        </IconButton>
      </div>

      <Card className="mt-6">
        <Toggle label={t.closing} checked={includeClosing} onChange={onClosing} />
        <p className="text-sm text-[#F7F3EA]/55">{closingText}</p>
      </Card>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[#0B0F0D] via-[#0B0F0D]/95 to-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
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
