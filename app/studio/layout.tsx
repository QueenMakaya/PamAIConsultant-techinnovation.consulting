import type { CSSProperties, ReactNode } from "react"
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google"

// AVA's brand fonts and palette, scoped to this route (the stage canvas reads
// the font variables too).
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" })

const palette = {
  "--ava-coral": "#F06A6A",
  "--ava-crimson": "#E8384F",
  "--ava-crimson-deep": "#C92A40",
  "--ava-ink": "#1E1F21",
  "--ava-blush": "#FFE5E0",
  "--ava-cream": "#FFF8F5",
  "--ava-paper": "#FAF8F4",
  "--ava-line": "#E8E6E1",
  "--ava-mist": "#6B6F76",
  "--ava-gold": "#C9A66B",
  "--ava-online": "#34D399",
} as CSSProperties

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${fraunces.variable} ${inter.variable} ${mono.variable} min-h-dvh w-full bg-[var(--ava-paper)] text-[var(--ava-ink)] antialiased`}
      style={{ ...palette, fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {children}
    </div>
  )
}
