"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Download } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { generatePDF } from "@/lib/pdf-generator"
import { useState } from "react"

export function Hero() {
  const { language, t } = useLanguage()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadCV = async () => {
    setIsDownloading(true)
    await generatePDF(language)
    setTimeout(() => setIsDownloading(false), 1000)
  }

  const handleContactClick = () => {
    const contactSection = document.getElementById("contact")
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="absolute inset-0 bg-gradient-to-tr from-tertiary/5 via-transparent to-quaternary/5" />

      <div className="geometric-shape geometric-hexagon w-96 h-96 bg-primary/15 top-20 right-10 blur-3xl animate-pulse" />
      <div className="geometric-shape geometric-diamond w-80 h-80 bg-accent/15 bottom-20 left-10 blur-3xl animate-pulse delay-1000" />
      <div className="geometric-shape geometric-triangle w-64 h-64 bg-tertiary/10 top-1/3 right-1/3 blur-2xl animate-pulse delay-500" />
      <div className="geometric-shape w-72 h-72 bg-quaternary/10 bottom-1/3 right-1/4 blur-3xl animate-pulse delay-700 rounded-full" />

      <div
        className="absolute top-1/4 left-1/4 w-4 h-4 border-2 border-primary/30 geometric-diamond animate-bounce"
        style={{ animationDelay: "0s", animationDuration: "3s" }}
      />
      <div
        className="absolute top-1/3 right-1/3 w-6 h-6 border-2 border-accent/30 geometric-hexagon animate-bounce"
        style={{ animationDelay: "1s", animationDuration: "4s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-5 h-5 border-2 border-tertiary/30 rotate-45 animate-bounce"
        style={{ animationDelay: "0.5s", animationDuration: "3.5s" }}
      />

      <div className="container-custom relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display text-balance leading-tight">
              Pamela Alfred
            </h1>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-balance">
              <span className="bg-gradient-to-r from-primary via-accent to-tertiary bg-clip-text text-transparent">
                {t.hero.title}
              </span>
            </h2>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-pretty">
              {t.hero.subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Button
              size="lg"
              className="gap-2 group relative overflow-hidden bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              onClick={handleContactClick}
            >
              {t.hero.cta}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 bg-transparent border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
              onClick={handleDownloadCV}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4" />
              {t.hero.downloadCV}
            </Button>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-2">
              <div className="w-1.5 h-3 bg-gradient-to-b from-primary to-accent rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
