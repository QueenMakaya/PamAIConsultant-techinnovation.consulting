import type { ReactNode } from "react"
import { Fraunces, Hanken_Grotesk } from "next/font/google"

// Same brand fonts as /validation, scoped to this route as CSS variables (the
// stage canvas reads them too).
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

export default function StudioLayout({ children }: { children: ReactNode }) {
  // A self-contained dark "studio" canvas covering the portfolio theme. No
  // portfolio nav/footer.
  return (
    <div
      className={`${fraunces.variable} ${hanken.variable} min-h-dvh w-full bg-[#0B0F0D] text-[#F7F3EA] antialiased`}
      style={{ fontFamily: "var(--font-hanken), system-ui, sans-serif" }}
    >
      {children}
    </div>
  )
}
