"use client"

import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react"
import { Check, Copy, X } from "lucide-react"

// The studio's design primitives. Dark, warm and quiet so the camera and the
// content carry the screen; one honey accent marks the single primary action.
// Every tap target is at least 44 px (Apple HIG / WCAG 2.5.5).

export const display = { fontFamily: "var(--font-fraunces), serif" } as const

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "md" | "lg"
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C14E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F0D]",
        size === "lg" ? "min-h-14 px-7 text-base" : "min-h-11 px-5 text-sm",
        variant === "primary" && "bg-[#F2C14E] text-[#14110A] shadow-[0_8px_30px_-8px_rgba(242,193,78,0.55)] hover:bg-[#F6D06F]",
        variant === "secondary" && "bg-white/[0.08] text-[#F7F3EA] hover:bg-white/[0.14]",
        variant === "ghost" && "text-[#F7F3EA]/75 hover:bg-white/[0.06] hover:text-[#F7F3EA]",
        variant === "danger" && "bg-[#FF453A]/15 text-[#FF8A80] hover:bg-[#FF453A]/25",
        className,
      )}
    />
  )
}

export function IconButton({ label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cx(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/35 text-[#F7F3EA] backdrop-blur-md transition hover:bg-black/55 active:scale-95 disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C14E]",
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
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  full?: boolean
}) {
  return (
    <div role="radiogroup" className={cx("inline-flex gap-1 rounded-full bg-white/[0.06] p-1", full && "flex w-full")}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            "min-h-10 rounded-full px-4 text-sm transition",
            full && "flex-1",
            o.value === value ? "bg-[#F7F3EA] font-semibold text-[#14110A]" : "text-[#F7F3EA]/70 hover:text-[#F7F3EA]",
          )}
        >
          {o.label}
        </button>
      ))}
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
      className="flex min-h-12 w-full items-center justify-between gap-4 text-left text-sm text-[#F7F3EA]/85"
    >
      <span>{label}</span>
      <span className={cx("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-[#F2C14E]" : "bg-white/15")}>
        <span
          className={cx(
            "absolute top-1 h-5 w-5 rounded-full shadow transition-all",
            checked ? "left-6 bg-[#14110A]" : "left-1 bg-[#F7F3EA]",
          )}
        />
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
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#F7F3EA]/45">{label}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={value === c}
            onClick={() => onChange(c)}
            className={cx(
              "h-9 w-9 rounded-full ring-offset-2 ring-offset-[#131A16] transition",
              value === c ? "ring-2 ring-[#F2C14E]" : "ring-1 ring-white/15 hover:ring-white/40",
            )}
            style={{ background: c }}
          />
        ))}
        <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full ring-1 ring-white/15" title={label}>
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
        copied ? "bg-[#2FBF71]/20 text-[#7BE0A8]" : "bg-white/[0.08] text-[#F7F3EA]/85 hover:bg-white/[0.14]",
      )}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? done : label}
    </button>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-3xl bg-[#131A16] p-5 ring-1 ring-white/[0.06] sm:p-6", className)}>{children}</div>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F2C14E]">{children}</p>
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-2xl bg-white/[0.06]", className)} />
}

// A bottom sheet on phones, a right-hand panel on wider screens.
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  children: ReactNode
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
      <button type="button" aria-label={closeLabel} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div
        className={cx(
          "absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[28px] bg-[#131A16] px-5 pb-10 pt-3 ring-1 ring-white/10",
          "animate-in slide-in-from-bottom duration-300",
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-[28px] sm:pt-6 sm:slide-in-from-right sm:slide-in-from-bottom-0",
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl text-[#F7F3EA]" style={display}>
            {title}
          </h2>
          <IconButton label={closeLabel} onClick={onClose} className="bg-white/[0.06]">
            <X size={18} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-[#F7F3EA]/45">{children}</p>
}

export const inputCls =
  "w-full rounded-2xl bg-white/[0.06] px-4 py-3.5 text-base text-[#F7F3EA] placeholder:text-[#F7F3EA]/30 outline-none ring-1 ring-white/[0.08] transition focus:bg-white/[0.08] focus:ring-2 focus:ring-[#F2C14E]"
