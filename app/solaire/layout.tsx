import type { ReactNode } from "react"
import { Fraunces, Hanken_Grotesk } from "next/font/google"

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" })
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" })

// Solfutur lives on its own canvas: no portfolio nav, footer or theme.
export default function SolaireLayout({ children }: { children: ReactNode }) {
  return (
    <div
      lang="fr"
      className={`${fraunces.variable} ${hanken.variable} min-h-dvh w-full bg-[#FFF8EC] text-[#1B2A3A]`}
      style={{ fontFamily: "var(--font-hanken), system-ui, sans-serif" }}
    >
      {children}
    </div>
  )
}
