import type { ReactNode } from "react"
import { Fraunces, Hanken_Grotesk } from "next/font/google"

// Fonts are scoped to this route only, exposed as CSS variables.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
})

export default function ValidationLayout({ children }: { children: ReactNode }) {
  // A self-contained wrapper: its own fonts, its own full-viewport ivory
  // canvas covering the portfolio theme. No portfolio nav/footer/switcher.
  return (
    <div
      lang="fr"
      className={`${fraunces.variable} ${hanken.variable} min-h-dvh w-full bg-[#FAF6EE] text-[#003219]`}
      style={{ fontFamily: "var(--font-hanken), system-ui, sans-serif" }}
    >
      {children}
    </div>
  )
}
