import type React from "react"
import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { LanguageProvider } from "@/contexts/language-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" })

export const metadata: Metadata = {
  title: "Pamela Alfred | AI & Digital Transformation Consultant",
  description:
    "Expert in strategic innovation, AI integration, and digital transformation. Helping businesses leverage automation, no-code tools, and generative AI.",
  keywords:
    "AI consultant, digital transformation, automation, n8n, generative AI, business strategy, entrepreneurship coaching",
  authors: [{ name: "Pamela Alfred" }],
  openGraph: {
    title: "Pamela Alfred | AI & Digital Transformation Consultant",
    description: "Expert in strategic innovation, AI integration, and digital transformation.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <LanguageProvider>{children}</LanguageProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
