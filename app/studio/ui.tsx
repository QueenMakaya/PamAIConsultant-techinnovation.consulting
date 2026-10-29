"use client"

import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react"
import { Check, Copy, X } from "lucide-react"

// The studio's design primitives, in AVA's brand: warm paper, ink type, coral
// and crimson accents, Fraunces headlines, Inter text, JetBrains Mono labels.
// Every tap target is at least 44 px (Apple HIG / WCAG 2.5.5).

export const display = { fontFamily: "var(--font-fraunces), serif" } as const
export const mono = { fontFamily: "var(--font-mono), ui-monospace, monospace" } as const

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "secondary" | "ghost" | "danger"
  size?: "md" | "lg"
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[0.01em] transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ava-coral)] focus-visible:ring-offset-2",
        size === "lg" ? "min-h-14 px-7 text-base" : "min-h-11 px-5 text-sm",
        variant === "primary" &&
          "bg-[var(--ava-ink)] text-[var(--ava-cream)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(240,106,106,0.28),0_4px_10px_rgba(30,31,33,0.12)]",
        variant === "accent" &&
          "bg-gradient-to-br from-[var(--ava-coral)] to-[var(--ava-crimson)] text-white shadow-[0_10px_30px_-8px_rgba(232,56,79,0.55)] hover:-translate-y-0.5",
        variant === "secondary" && "bg-white text-[var(--ava-ink)] ring-1 ring-[var(--ava-line)] hover:ring-[var(--ava-ink)]/30",
        variant === "ghost" && "text-[var(--ava-ink)]/70 hover:bg-[var(--ava-ink)]/[0.05] hover:text-[var(--ava-ink)]",
        variant === "danger" && "bg-[var(--ava-blush)] text-[var(--ava-crimson-deep)] hover:bg-[#FFD6CF]",
        className,
      )}
    />
  )
}

// A round icon button. "glass" sits over the camera; "plain" over paper.
export function IconButton({
  label,
  className,
  tone = "glass",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: "glass" | "plain" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cx(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ava-coral)]",
        tone === "glass" ? "bg-black/35 text-white backdrop-blur-md hover:bg-black/55" : "text-[var(--ava-ink)]/70 hover:bg-[var(--ava-ink)]/[0.06]",
        className,
      )}
    />
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  full,
  dark,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  full?: boolean
  dark?: boolean
}) {
  return (
    <div
      role="radiogroup"
      className={cx("inline-flex gap-1 rounded-full p-1", dark ? "bg-white/10" : "bg-[var(--ava-ink)]/[0.05]", full && "flex w-full")}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "min-h-10 rounded-full px-4 text-sm transition",
              full && "flex-1",
              on
                ? dark
                  ? "bg-white font-semibold text-[var(--ava-ink)]"
                  : "bg-white font-semibold text-[var(--ava-ink)] shadow-[0_1px_3px_rgba(30,31,33,0.12)]"
                : dark
                  ? "text-white/70 hover:text-white"
                  : "text-[var(--ava-ink)]/60 hover:text-[var(--ava-ink)]",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-4 text-left text-sm text-[var(--ava-ink)]/85"
    >
      <span>{label}</span>
      <span
        className={cx(
          "relative h-7 w-12 shrink-0 rounded-full transition",
          checked ? "bg-gradient-to-r from-[var(--ava-coral)] to-[var(--ava-crimson)]" : "bg-[var(--ava-ink)]/15",
        )}
      >
        <span className={cx("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  )
}

export function Swatches({
  colors,
  value,
  onChange,
  label,
}: {
  colors: string[]
  value: string
  onChange: (c: string) => void
  label: string
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={value === c}
            onClick={() => onChange(c)}
            className={cx(
              "h-9 w-9 rounded-full ring-offset-2 ring-offset-white transition",
              value === c ? "ring-2 ring-[var(--ava-crimson)]" : "ring-1 ring-[var(--ava-ink)]/15 hover:ring-[var(--ava-ink)]/40",
            )}
            style={{ background: c }}
          />
        ))}
        <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full ring-1 ring-[var(--ava-ink)]/15" title={label}>
          <span className="absolute inset-0" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }} />
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0" />
        </label>
      </div>
    </div>
  )
}

export function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        })
      }}
      className={cx(
        "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition",
        copied ? "bg-[#DDF7EA] text-[#147A4B]" : "bg-[var(--ava-ink)]/[0.06] text-[var(--ava-ink)]/80 hover:bg-[var(--ava-ink)]/[0.1]",
      )}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? done : label}
    </button>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-3xl bg-white p-5 ring-1 ring-[var(--ava-line)] shadow-[0_1px_2px_rgba(30,31,33,0.04)] sm:p-6", className)}>
      {children}
    </div>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ava-crimson)]" style={mono}>
      {children}
    </p>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--ava-mist)]" style={mono}>
      {children}
    </p>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-2xl bg-[var(--ava-ink)]/[0.06]", className)} />
}

// AVA's mark: the coral → crimson orb with the three dots from the brand.
export function AvaMark({ size = 40, online = true }: { size?: number; online?: boolean }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ava-coral)] to-[var(--ava-crimson)]"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.52} height={size * 0.47} viewBox="0 0 21 19" fill="none" aria-hidden>
        <circle cx="10.5" cy="5.5" r="4.5" fill="white" opacity="0.92" />
        <circle cx="5.5" cy="14.5" r="4.5" fill="white" opacity="0.72" />
        <circle cx="15.5" cy="14.5" r="4.5" fill="white" opacity="0.72" />
      </svg>
      {online && (
        <span
          className="absolute rounded-full border-2 border-white bg-[var(--ava-online)]"
          style={{ width: size * 0.26, height: size * 0.26, right: 0, bottom: 0 }}
        />
      )}
    </span>
  )
}

// A bottom sheet on phones, a right-hand panel on wider screens. "dark" for
// sheets opened over the camera.
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  children,
  dark,
}: {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  children: ReactNode
  dark?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label={closeLabel} className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div
        className={cx(
          "absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[28px] px-5 pb-10 pt-3",
          dark ? "bg-[#26272A] text-white ring-1 ring-white/10" : "bg-[var(--ava-cream)] text-[var(--ava-ink)]",
          "animate-in slide-in-from-bottom duration-300",
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-[28px] sm:pt-6 sm:slide-in-from-right sm:slide-in-from-bottom-0",
        )}
      >
        <div className={cx("mx-auto mb-4 h-1.5 w-10 rounded-full sm:hidden", dark ? "bg-white/20" : "bg-[var(--ava-ink)]/15")} />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl" style={display}>
            {title}
          </h2>
          <IconButton label={closeLabel} onClick={onClose} tone="plain" className={dark ? "text-white/80 hover:bg-white/10" : undefined}>
            <X size={18} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

export const inputCls =
  "w-full rounded-2xl bg-white px-4 py-3.5 text-base text-[var(--ava-ink)] placeholder:text-[var(--ava-ink)]/30 outline-none ring-1 ring-[var(--ava-line)] transition focus:ring-2 focus:ring-[var(--ava-coral)]"
