"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { AvatarLook, Brief, EpisodeLang } from "@/lib/studio/types"
import type { UiCopy } from "../copy"
import { Button, Eyebrow, cx, display, inputCls } from "../ui"
import AvatarPreview from "./AvatarPreview"

type StepKey = keyof UiCopy["briefSteps"]

// Name, business and offer are needed to personalise anything; the rest can be
// skipped and filled in later from the profile.
const STEPS: { key: StepKey; required?: boolean; multiline?: boolean }[] = [
  { key: "name", required: true },
  { key: "business", required: true },
  { key: "offer", required: true, multiline: true },
  { key: "audience", multiline: true },
  { key: "transformation", multiline: true },
  { key: "proof", multiline: true },
  { key: "cta" },
  { key: "lang" },
]

export function Welcome({
  t,
  look,
  portrait,
  onStart,
}: {
  t: UiCopy
  look: AvatarLook
  portrait: string | null
  onStart: () => void
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] animate-in fade-in duration-700">
      <div className="flex flex-1 flex-col justify-center pb-6">
        <div className="relative mb-8 h-24 w-24">
          <span className="absolute -inset-6 rounded-full bg-[#F2C14E]/20 blur-2xl" />
          <span className="absolute -inset-1.5 rounded-full ring-2 ring-[#F2C14E]/60" />
          <AvatarPreview look={look} portrait={portrait} size={96} speaking />
        </div>
        <Eyebrow>{t.welcomeEyebrow}</Eyebrow>
        <h1 className="mt-3 text-[2.25rem] leading-[1.05] text-[#F7F3EA] sm:text-5xl" style={display}>
          {t.welcomeTitle}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#F7F3EA]/65 sm:text-lg">{t.welcomeText}</p>

        <ol className="mt-8 space-y-4">
          {t.welcomeSteps.map((step, i) => (
            <li key={step.title} className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${200 + i * 120}ms`, animationFillMode: "both" }}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-sm font-semibold text-[#F2C14E]">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-[#F7F3EA]">{step.title}</p>
                <p className="text-sm text-[#F7F3EA]/55">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <Button size="lg" className="sticky bottom-[max(1.5rem,env(safe-area-inset-bottom))] w-full" onClick={onStart}>
        {t.welcomeCta}
        <ArrowRight size={18} />
      </Button>
    </div>
  )
}

export function BriefForm({
  t,
  brief,
  onChange,
  onDone,
  onExit,
}: {
  t: UiCopy
  brief: Brief
  onChange: (b: Brief) => void
  onDone: () => void
  onExit: () => void
}) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const copy = t.briefSteps[current.key]
  const last = step === STEPS.length - 1
  const value = current.key === "lang" ? "" : (brief[current.key as Exclude<StepKey, "lang">] ?? "")
  const canContinue = !current.required || value.trim().length > 0
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [step])

  const go = (dir: 1 | -1) => {
    if (dir === 1 && last) return onDone()
    if (dir === -1 && step === 0) return onExit()
    setStep((s) => s + dir)
  }

  const set = (key: keyof Brief, v: string) => onChange({ ...brief, [key]: v })

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && canContinue) {
      e.preventDefault()
      go(1)
    }
  }

  const langOptions: { value: EpisodeLang; label: string }[] = [
    { value: "fr", label: t.langFr },
    { value: "en", label: t.langEn },
    { value: "mix", label: t.langMix },
  ]

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-6 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={t.back}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-[#F7F3EA]/70 hover:bg-white/[0.06]"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-[#F2C14E] transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <span className="w-10 text-right text-xs tabular-nums text-[#F7F3EA]/45">
          {step + 1}/{STEPS.length}
        </span>
      </div>

      <div key={current.key} className="flex flex-1 flex-col justify-center py-10 animate-in fade-in slide-in-from-right-4 duration-300">
        <label htmlFor={`brief-${current.key}`} className="text-3xl leading-tight text-[#F7F3EA] sm:text-4xl" style={display}>
          {copy.label}
        </label>
        {copy.help && <p className="mt-3 text-[#F7F3EA]/55">{copy.help}</p>}

        <div className="mt-8">
          {current.key === "lang" ? (
            <div className="grid gap-3">
              {langOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onChange({ ...brief, lang: o.value })}
                  className={cx(
                    "min-h-14 rounded-2xl px-5 text-left text-lg transition",
                    brief.lang === o.value ? "bg-[#F7F3EA] font-semibold text-[#14110A]" : "bg-white/[0.06] text-[#F7F3EA] hover:bg-white/[0.1]",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : current.multiline ? (
            <textarea
              id={`brief-${current.key}`}
              ref={inputRef}
              rows={3}
              value={value}
              placeholder={copy.placeholder}
              onChange={(e) => set(current.key as keyof Brief, e.target.value)}
              onKeyDown={onKeyDown}
              className={cx(inputCls, "resize-none text-lg leading-relaxed")}
            />
          ) : (
            <div className="space-y-3">
              <input
                id={`brief-${current.key}`}
                ref={inputRef}
                value={value}
                placeholder={copy.placeholder}
                onChange={(e) => set(current.key as keyof Brief, e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete={current.key === "name" ? "given-name" : current.key === "business" ? "organization" : "off"}
                className={cx(inputCls, "text-lg")}
              />
              {current.key === "cta" && (
                <input
                  type="url"
                  inputMode="url"
                  value={brief.link}
                  placeholder={t.linkPlaceholder}
                  onChange={(e) => set("link", e.target.value)}
                  onKeyDown={onKeyDown}
                  className={inputCls}
                />
              )}
            </div>
          )}
          {current.key !== "lang" && (
            <p className="mt-3 hidden text-xs text-[#F7F3EA]/35 sm:block">{t.pressEnter}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!current.required && !last && (
          <Button variant="ghost" size="lg" onClick={() => go(1)}>
            {t.skipStep}
          </Button>
        )}
        <Button size="lg" className="flex-1" disabled={!canContinue} onClick={() => go(1)}>
          {last ? t.finish : t.continue}
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  )
}
