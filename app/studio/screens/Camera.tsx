"use client"

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { ArrowRight, Camera as CameraIcon, Coffee, MoreHorizontal, Pause, Play, Repeat, Settings, SkipForward, Square, SwitchCamera, Wand2, X } from "lucide-react"
import type { Format } from "@/lib/studio/types"
import { fill, type UiCopy } from "../copy"
import type { InterviewView } from "../interview"
import { stageSize } from "../stage"
import { Button, IconButton, Sheet, cx, display } from "../ui"

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
}) {
  const { w, h } = stageSize(format)
  const fit = useFit(w / h)
  const [more, setMore] = useState(false)
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
  const showPrompt = live && view.hostLine && (view.mode !== "speaking" || view.paused)

  const act = (fn: () => void) => () => {
    setMore(false)
    fn()
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-[#F7F3EA]">
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
                <span className="rounded-full bg-black/40 px-3 py-2 text-sm tabular-nums text-[#F7F3EA]/80 backdrop-blur-md">
                  {fill(t.questionOf, { i: Math.min(view.index + 1, total), n: total })}
                </span>
              )}
            </>
          ) : (
            <span className="rounded-full bg-black/40 px-3.5 py-2 text-sm text-[#F7F3EA]/80 backdrop-blur-md">
              {format === "vertical" ? "9:16" : "16:9"}
            </span>
          )}
        </div>

        <div className="flex gap-2">
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
        <div className="relative overflow-hidden rounded-[22px] bg-[#0E1411]" style={{ width: fit.size.w, height: fit.size.h }}>
          <canvas ref={canvasRef} width={w} height={h} className="block h-full w-full" />

          {/* Teleprompter: what to answer, never in the recording. In 16:9 it sits
              near the lens; in 9:16 the host bubble owns the top, so the question
              and what the host hears share one card at the bottom. */}
          {format === "horizontal" && showPrompt && (
            <div className="absolute inset-x-3 top-3 rounded-2xl bg-black/55 px-4 py-3 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-[15px] font-medium leading-snug sm:text-lg" style={display}>
                {view.hostLine}
              </p>
            </div>
          )}

          {(listening || (format === "vertical" && showPrompt)) && (
            <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-black/60 px-4 py-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
              {format === "vertical" && showPrompt && (
                <p className="text-[15px] font-medium leading-snug" style={display}>
                  {view.hostLine}
                </p>
              )}
              {listening && (
                <p
                  className={cx(
                    "text-sm leading-snug text-[#F7F3EA]/75",
                    format === "vertical" && showPrompt && "mt-2 border-t border-white/10 pt-2 text-[13px]",
                  )}
                >
                  {heardTail || <span className="text-[#F7F3EA]/45">{t.heardEmpty}</span>}
                </p>
              )}
            </div>
          )}

          {phase === "countdown" && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span key={countdown} className="text-[8rem] leading-none text-[#F7F3EA] animate-in zoom-in-50 fade-in duration-500" style={display}>
                {countdown}
              </span>
            </div>
          )}

          {view.minute && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0B0F0D]/85 p-6 text-center backdrop-blur-sm animate-in fade-in">
              <Coffee size={28} className="text-[#F2C14E]" />
              <p className="text-3xl" style={display}>
                {t.minuteTitle}
              </p>
              <p className="max-w-xs text-[#F7F3EA]/70">{t.minuteText}</p>
              <Button size="lg" onClick={onPause}>
                <Play size={18} />
                {t.resume}
              </Button>
            </div>
          )}

          {!devicesOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0B0F0D] p-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.07] text-[#F2C14E]">
                <CameraIcon size={28} />
              </span>
              <p className="text-2xl" style={display}>
                {t.permTitle}
              </p>
              <p className="max-w-xs text-sm leading-relaxed text-[#F7F3EA]/60">{t.permText}</p>
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
            <p className="text-xs text-[#F7F3EA]/50">{fill(t.readyMeta, { n: total })}</p>
            {warnings.map((wn) => (
              <p key={wn} className="mx-auto mt-2 max-w-sm text-xs text-[#F2C14E]/90">
                {wn}
              </p>
            ))}
          </div>
        )}
        {live && (
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#F7F3EA]/55">{stateLabel}</p>
        )}

        <div className="mx-auto grid max-w-sm grid-cols-3 items-center">
          <div className="flex justify-start">
            {live && (
              <button
                type="button"
                onClick={onEnd}
                aria-label={t.end}
                className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white/10 text-[#F7F3EA] backdrop-blur-md transition hover:bg-white/15 active:scale-95"
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
                className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-[#F7F3EA] text-[#14110A] transition active:scale-95"
              >
                <Play size={30} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                disabled={!listening}
                aria-label={t.next}
                className="relative flex h-[84px] w-[84px] items-center justify-center rounded-full bg-[#F2C14E] text-[#14110A] shadow-[0_10px_40px_-10px_rgba(242,193,78,0.8)] transition active:scale-95 disabled:bg-white/15 disabled:text-[#F7F3EA]/60 disabled:shadow-none"
              >
                <span ref={ringRef} className="absolute -inset-1.5 rounded-full ring-2 ring-[#F2C14E]/70" />
                {view.mode === "speaking" || view.mode === "thinking" ? (
                  <span className="flex items-end gap-1" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 animate-pulse rounded-full bg-current" style={{ height: 10 + i * 6, animationDelay: `${i * 150}ms` }} />
                    ))}
                  </span>
                ) : (
                  <ArrowRight size={32} />
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
        {live && <p className="mt-2 text-center text-sm font-semibold">{view.paused ? t.resume : t.next}</p>}
      </div>

      <Sheet open={more} onClose={() => setMore(false)} title={t.more} closeLabel={t.close}>
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
              <span className="text-[#F2C14E]">{row.icon}</span>
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
