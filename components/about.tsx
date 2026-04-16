"use client"

import { useLanguage } from "@/contexts/language-context"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { Sparkles, Zap, Target } from "lucide-react"

export function About() {
  const { t, language } = useLanguage()

  return (
    <section id="about" className="section-padding bg-muted/30 relative overflow-hidden">
      <div className="geometric-shape geometric-hexagon w-64 h-64 bg-primary/5 top-10 right-20 blur-2xl" />
      <div className="geometric-shape geometric-diamond w-48 h-48 bg-accent/5 bottom-20 left-10 blur-2xl" />
      <div className="geometric-shape geometric-triangle w-32 h-32 bg-tertiary/5 top-1/2 left-1/4 blur-xl" />

      <div className="container-custom relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-center mb-16 text-balance">
            <span className="bg-gradient-to-r from-primary via-accent to-tertiary bg-clip-text text-transparent">
              {t.about.title}
            </span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Image column */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-tertiary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-muted/50 to-background">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Pam%20Profile%20Pic-Joy-QcLuiBwlCnusqPPxyIpSqMIR0soIB9.jpg"
                  alt="Pamela Alfred"
                  fill
                  className="object-contain"
                  priority
                />
                <div className="absolute top-4 right-4 w-16 h-16 border-2 border-accent/50 geometric-hexagon" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-tertiary/50 geometric-diamond" />
              </div>
            </div>

            {/* Content column */}
            <div className="space-y-6">
              <Card className="p-8 bg-card/50 backdrop-blur-sm gradient-border depth-card">
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-pretty">
                  {t.about.description}
                </p>
              </Card>

              <div className="grid grid-cols-1 gap-4">
                <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 depth-card group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-primary">{t.about.innovation}</h3>
                      <p className="text-sm text-muted-foreground">{t.about.innovationDesc}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 depth-card group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <Zap className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-accent">{t.about.efficiency}</h3>
                      <p className="text-sm text-muted-foreground">{t.about.efficiencyDesc}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-tertiary/10 to-tertiary/5 border-tertiary/20 depth-card group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-tertiary/10 group-hover:bg-tertiary/20 transition-colors">
                      <Target className="h-6 w-6 text-tertiary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-tertiary">{t.about.results}</h3>
                      <p className="text-sm text-muted-foreground">{t.about.resultsDesc}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
