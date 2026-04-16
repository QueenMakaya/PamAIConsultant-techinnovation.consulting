"use client"

import { useLanguage } from "@/contexts/language-context"
import { Card } from "@/components/ui/card"
import { Lightbulb, Rocket, Users, Zap } from "lucide-react"

export function Company() {
  const { t } = useLanguage()

  const services = [
    {
      icon: Lightbulb,
      title: t.company.service1,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Zap,
      title: t.company.service2,
      color: "text-tertiary",
      bg: "bg-tertiary/10",
    },
    {
      icon: Users,
      title: t.company.service3,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      icon: Rocket,
      title: t.company.service4,
      color: "text-quaternary",
      bg: "bg-quaternary/10",
    },
  ]

  return (
    <section id="company" className="section-padding bg-muted/30 relative overflow-hidden">
      <div className="geometric-shape geometric-hexagon w-96 h-96 bg-primary/10 top-10 right-10 blur-3xl" />
      <div className="geometric-shape geometric-diamond w-64 h-64 bg-tertiary/10 bottom-20 left-20 blur-2xl" />

      <div className="container-custom relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 text-balance">
            <span className="bg-gradient-to-r from-primary via-tertiary to-accent bg-clip-text text-transparent">
              {t.company.title}
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-2">{t.company.subtitle}</p>
          <p className="text-sm text-primary font-semibold">{t.company.founded}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          <Card className="p-8 depth-card border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="geometric-shape geometric-triangle w-20 h-20 bg-primary/10 absolute top-4 right-4" />
            <h3 className="text-2xl font-bold font-display mb-4 text-primary">{t.company.mission}</h3>
            <p className="text-muted-foreground leading-relaxed">{t.company.missionText}</p>
          </Card>

          <Card className="p-8 depth-card border-2 border-tertiary/20 bg-gradient-to-br from-tertiary/5 to-transparent">
            <div className="geometric-shape geometric-hexagon w-20 h-20 bg-tertiary/10 absolute top-4 right-4" />
            <p className="text-muted-foreground leading-relaxed">{t.company.description}</p>
          </Card>
        </div>

        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold font-display text-center mb-8">{t.company.services}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <Card
                  key={index}
                  className="p-6 depth-card hover:scale-105 transition-transform duration-300 border-2 border-border/50"
                >
                  <div className={`${service.bg} p-4 rounded-lg w-fit mb-4`}>
                    <Icon className={`h-6 w-6 ${service.color}`} />
                  </div>
                  <p className="font-medium leading-snug">{service.title}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
