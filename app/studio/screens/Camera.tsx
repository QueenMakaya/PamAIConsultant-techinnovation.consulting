"use client"

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { ArrowRight, Camera as CameraIcon, Check, Coffee, MoreHorizontal, Pause, Play, Repeat, Settings, SkipForward, Sparkles, Square, SwitchCamera, Wand2, X } from "lucide-react"
import type { Format } from "@/lib/studio/types"
import { FILTER_PRESETS, filterActive, type FilterSettings } from "../beauty"
import { fill, type UiCopy } from "../copy"
import type { InterviewView } from "../interview"
import { stageSize } from "../stage"
import { AvaMark, Button, IconButton, Segmented, Sheet, cx, display, mono } from "../ui"

export type CameraPhase = "ready" | "countdown" | "live"

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

// Contain-fits a box of the given aspect ratio inside its parent.
function useFit(ratio: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      const w = Math.min(width, height * ratio)
      setSize({ w, h: w / ratio })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ratio])
  return { ref, size }
}

export default function CameraScreen({
  t,
  format,
  canvasRef,
  level,
  devicesOn,
  deviceError,
  onAllow,
  phase,
  countdown,
  view,
  elapsed,
  total,
  practice,
  warnings,
  canFlip,
  onFlip,
  onStart,
  onNext,
  onSkip,
  onRephrase,
  onRepeat,
  onPause,
  onMinute,
  onEnd,
  onClose,
  onSettings,
  filter,
  onFilter,
  filterSupported,
  handsFree,
  captions,
}: {
  t: UiCopy
  format: Format
  canvasRef: RefObject<HTMLCanvasElement | null>
  level: () => number
  devicesOn: boolean
  deviceError: boolean
  onAllow: () => void
  phase: CameraPhase
  countdown: number
  view: InterviewView
  elapsed: number
  total: number
  practice: boolean
  warnings: string[]
  canFlip: boolean
  onFlip: () => void
  onStart: () => void
  onNext: () => void
  onSkip: () => void
  onRephrase: () => void
  onRepeat: () => void
  onPause: () => void
  onMinute: () => void
  onEnd: () => void
  onClose: () => void
  onSettings: () => void
  filter: FilterSettings
  onFilter: (f: FilterSettings) => void
  filterSupported: boolean
  handsFree: boolean
  captions: boolean
}) {
  const { w, h } = stageSize(format)
  const fit = useFit(w / h)
  const [more, setMore] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const ringRef = useRef<HTMLSpanElement>(null)
  const live = phase === "live"
  const listening = live && view.mode === "listening" && !view.paused

  // The ring around the main button breathes with the mic level: proof the
  // studio hears you, without a separate meter.
  useEffect(() => {
    let raf = 0
    const frame = () => {
      const el = ringRef.current
      if (el) {
        const l = Math.min(1, level() * 2.4)
        el.style.transform = `scale(${1 + l * 0.22})`
        el.style.opacity = String(0.35 + l * 0.65)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [level])

  const stateLabel = view.paused
    ? t.paused
    : view.mode === "speaking"
      ? t.stateSpeaking
      : view.mode === "listening"
        ? t.stateListening
        : view.mode === "thinking"
          ? t.stateThinking
          : t.stateIdle

  const heard = `${view.heard} ${view.interim}`.trim()
  const heardTail = heard.length > 160 ? `…${heard.slice(-160)}` : heard
  const showAva = live && !!view.hostLine && (view.mode === "thinking" || view.mode !== "speaking" || !captions)

  const act = (fn: () => void) => () => {
    setMore(false)
    fn()
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-[#FFF8F5]">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <IconButton label={t.close} onClick={onClose}>
          <X size={20} />
        </IconButton>

        <div className="flex items-center gap-2">
          {live || phase === "countdown" ? (
            <>
              <span
                className={cx(
                  "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold tabular-nums backdrop-blur-md",
                  practice ? "bg-white/15" : "bg-[#FF453A]/90",
                )}
              >
                {!practice && <span className={cx("h-2 w-2 rounded-full bg-white", !view.paused && "animate-pulse")} />}
                {practice ? t.practiceBadge : view.paused ? t.paused : clock(elapsed)}
              </span>
              {total > 0 && (
                <span className="rounded-full bg-black/40 px-3 py-2 text-sm tabular-nums text-[#FFF8F5]/80 backdrop-blur-md">
                  {fill(t.questionOf, { i: Math.min(view.index + 1, total), n: total })}
                </span>
              )}
            </>
          ) : (
            <span className="rounded-full bg-black/40 px-3.5 py-2 text-sm text-[#FFF8F5]/80 backdrop-blur-md">
              {format === "vertical" ? "9:16" : "16:9"}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {!live && phase !== "countdown" && (
            <IconButton
              label={t.filter}
              onClick={() => setFilterOpen(true)}
              className={filterActive(filter) ? "bg-gradient-to-br from-[var(--ava-coral)] to-[var(--ava-crimson)] text-white hover:from-[var(--ava-coral)]" : undefined}
            >
              <Sparkles size={19} />
            </IconButton>
          )}
          {canFlip && !live && (
            <IconButton label="Flip" onClick={onFlip}>
              <SwitchCamera size={19} />
            </IconButton>
          )}
          {!live && phase !== "countdown" && (
            <IconButton label={t.settings} onClick={onSettings}>
              <Settings size={19} />
            </IconButton>
          )}
          {live && <span className="w-11" />}
        </div>
      </div>

      {/* Stage */}
      <div ref={fit.ref} className="relative flex min-h-0 flex-1 items-center justify-center px-3">
        <div className="relative overflow-hidden rounded-[22px] bg-[var(--ava-ink)]" style={{ width: fit.size.w, height: fit.size.h }}>
          <canvas ref={canvasRef} width={w} height={h} className="block h-full w-full" />

          {/* The conversation, as chat bubbles over the preview (never in the
              recording): AVA's latest line, then what AVA hears you say. While
              AVA speaks with captions on, the recorded caption shows her line. */}
          {live && (showAva || listening) && (
            <div className={cx("absolute bottom-3 left-3 flex flex-col gap-2", format === "vertical" ? "right-3" : "w-[min(560px,70%)]")}>
              {showAva && (
                <div className="flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <AvaMark size={28} online={false} />
                  <div className="max-w-[88%] rounded-[20px] rounded-bl-md bg-[var(--ava-cream)]/95 px-4 py-2.5 text-[var(--ava-ink)] shadow-lg">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ava-crimson)]" style={mono}>
                      AVA
                    </p>
                    {view.mode === "thinking" ? (
                      <span className="mt-1 flex gap-1" aria-label={t.stateThinking}>
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-[var(--ava-crimson)]" style={{ animationDelay: `${i * 120}ms` }} />
                        ))}
                      </span>
                    ) : (
                      <p className="mt-0.5 text-[15px] leading-snug" style={display}>
                        {view.hostLine}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {listening && (
                <div className="ml-auto max-w-[85%] rounded-[20px] rounded-br-md bg-black/55 px-4 py-2.5 text-white backdrop-blur-md animate-in fade-in">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50" style={mono}>
                    {t.you}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-white/90">{heardTail || <span className="italic text-white/50">{t.heardEmpty}</span>}</p>
                </div>
              )}
            </div>
          )}

          {phase === "countdown" && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span key={countdown} className="text-[8rem] leading-none text-[#FFF8F5] animate-in zoom-in-50 fade-in duration-500" style={display}>
                {countdown}
              </span>
            </div>
          )}

          {view.minute && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--ava-ink)]/85 p-6 text-center backdrop-blur-sm animate-in fade-in">
              <Coffee size={28} className="text-[var(--ava-coral)]" />
              <p className="text-3xl" style={display}>
                {t.minuteTitle}
              </p>
              <p className="max-w-xs text-[#FFF8F5]/70">{t.minuteText}</p>
              <Button size="lg" onClick={onPause}>
                <Play size={18} />
                {t.resume}
              </Button>
            </div>
          )}

          {!devicesOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--ava-ink)] p-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.07] text-[var(--ava-coral)]">
                <CameraIcon size={28} />
              </span>
              <p className="text-2xl" style={display}>
                {t.permTitle}
              </p>
              <p className="max-w-xs text-sm leading-relaxed text-[#FFF8F5]/60">{t.permText}</p>
              {deviceError && <p className="max-w-xs text-sm text-[#FF8A80]">{t.cameraError}</p>}
              <Button size="lg" onClick={onAllow}>
                {t.permAllow}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Controls, in the thumb zone */}
      <div className="relative z-10 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        {!live && phase !== "countdown" && devicesOn && (
          <div className="mb-3 text-center">
            <p className="font-semibold">{t.tapToStart}</p>
            <p className="text-xs text-[#FFF8F5]/50">{fill(t.readyMeta, { n: total })}</p>
            {warnings.map((wn) => (
              <p key={wn} className="mx-auto mt-2 max-w-sm text-xs text-[var(--ava-coral)]">
                {wn}
              </p>
            ))}
          </div>
        )}
        {live && (
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#FFF8F5]/55">{stateLabel}</p>
        )}

        <div className="mx-auto grid max-w-sm grid-cols-3 items-center">
          <div className="flex justify-start">
            {live && (
              <button
                type="button"
                onClick={onEnd}
                aria-label={t.end}
                className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white/10 text-[#FFF8F5] backdrop-blur-md transition hover:bg-white/15 active:scale-95"
              >
                <Square size={18} fill="currentColor" />
              </button>
            )}
          </div>

          <div className="flex justify-center">
            {!live ? (
              <button
                type="button"
                onClick={onStart}
                disabled={!devicesOn || phase === "countdown"}
                aria-label={t.tapToStart}
                className="relative flex h-[84px] w-[84px] items-center justify-center rounded-full disabled:opacity-40"
              >
                <span ref={ringRef} className="absolute inset-0 rounded-full ring-4 ring-white transition-transform duration-75" />
                <span className={cx("h-[66px] w-[66px] rounded-full bg-[#FF453A] transition active:scale-90", phase === "countdown" && "scale-75 rounded-2xl")} />
              </button>
            ) : view.paused && !view.minute ? (
              <button
                type="button"
                onClick={onPause}
                aria-label={t.resume}
                className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-[var(--ava-cream)] text-[var(--ava-ink)] transition active:scale-95"
              >
                <Play size={30} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                disabled={!listening}
                aria-label={t.next}
                className="relative flex h-[84px] w-[84px] items-center justify-center rounded-full bg-gradient-to-br from-[var(--ava-coral)] to-[var(--ava-crimson)] text-white shadow-[0_10px_40px_-10px_rgba(232,56,79,0.85)] transition active:scale-95 disabled:from-white/15 disabled:to-white/15 disabled:text-white/60 disabled:shadow-none"
              >
                <span ref={ringRef} className="absolute -inset-1.5 rounded-full ring-2 ring-[var(--ava-coral)]/70" />
                {view.mode === "speaking" || view.mode === "thinking" ? (
                  <span className="flex items-end gap-1" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 animate-pulse rounded-full bg-current" style={{ height: 10 + i * 6, animationDelay: `${i * 150}ms` }} />
                    ))}
                  </span>
                ) : (
                  handsFree ? <Check size={32} /> : <ArrowRight size={32} />
                )}
              </button>
            )}
          </div>

          <div className="flex justify-end">
            {live && (
              <button
                type="button"
                onClick={() => setMore(true)}
                aria-label={t.more}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/15 active:scale-95"
              >
                <MoreHorizontal size={22} />
              </button>
            )}
          </div>
        </div>
        {live && <p className="mt-2 text-center text-sm font-semibold">{view.paused ? t.resume : handsFree ? t.done2 : t.next}</p>}
      </div>

      <Sheet dark open={filterOpen} onClose={() => setFilterOpen(false)} title={t.filterTitle} closeLabel={t.close}>
        {!filterSupported ? (
          <p className="text-sm text-[#FFF8F5]/60">{t.filterNoGpu}</p>
        ) : (
          <div className="space-y-6">
            <p className="text-sm leading-relaxed text-[#FFF8F5]/60">{t.filterHint}</p>
            <Segmented
              full
              dark
              value={filter.preset === "custom" ? ("" as FilterSettings["preset"]) : filter.preset}
              options={[
                { value: "off", label: t.filterOff },
                { value: "soft", label: t.filterSoft },
                { value: "glow", label: t.filterGlow },
              ]}
              onChange={(p) => p !== "custom" && onFilter({ preset: p, ...FILTER_PRESETS[p] })}
            />
            {(
              [
                ["smooth", t.smooth],
                ["light", t.light],
                ["warmth", t.warmth],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-2 flex justify-between text-sm text-[#FFF8F5]/85">
                  {label}
                  <span className="tabular-nums text-[#FFF8F5]/45">{Math.round(filter[key] * 100)}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(filter[key] * 100)}
                  onChange={(e) => onFilter({ ...filter, preset: "custom", [key]: Number(e.target.value) / 100 })}
                  className="h-11 w-full cursor-pointer accent-[var(--ava-coral)]"
                />
              </label>
            ))}
          </div>
        )}
      </Sheet>

      <Sheet dark open={more} onClose={() => setMore(false)} title={t.more} closeLabel={t.close}>
        <div className="grid gap-2">
          {[
            { icon: <SkipForward size={20} />, label: t.skip, fn: onSkip, disabled: !listening },
            { icon: <Wand2 size={20} />, label: t.rephrase, fn: onRephrase, disabled: !listening },
            { icon: <Repeat size={20} />, label: t.repeat, fn: onRepeat, disabled: !listening },
            { icon: view.paused ? <Play size={20} /> : <Pause size={20} />, label: view.paused ? t.resume : t.pause, fn: onPause, disabled: !listening && !view.paused },
            { icon: <Coffee size={20} />, label: t.minute, fn: onMinute, disabled: !listening },
          ].map((row) => (
            <button
              key={row.label}
              type="button"
              disabled={row.disabled}
              onClick={act(row.fn)}
              className="flex min-h-14 items-center gap-4 rounded-2xl bg-white/[0.05] px-5 text-left font-semibold transition hover:bg-white/[0.09] disabled:opacity-35"
            >
              <span className="text-[var(--ava-coral)]">{row.icon}</span>
              {row.label}
            </button>
          ))}
          <button
            type="button"
            onClick={act(onEnd)}
            className="mt-2 flex min-h-14 items-center gap-4 rounded-2xl bg-[#FF453A]/10 px-5 text-left font-semibold text-[#FF8A80] transition hover:bg-[#FF453A]/20"
          >
            <Square size={18} fill="currentColor" />
            {t.end}
          </button>
        </div>
      </Sheet>
    </div>
  )
}
