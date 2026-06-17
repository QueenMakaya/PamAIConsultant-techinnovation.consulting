"use client"

import { useLanguage } from "@/contexts/language-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface Project {
  title: { en: string; fr: string }
  description: { en: string; fr: string }
  tags: string[]
  link?: string
  image: string
}

const projects: Project[] = [
  {
    title: {
      en: "AVA — AI Brand Assistant",
      fr: "AVA — Assistant de Marque IA",
    },
    description: {
      en: "An AI virtual assistant that learns a brand's story, products, and voice, then answers customers 24/7 — on the website, at pop-up booths, and in the link in bio.",
      fr: "Un assistant virtuel IA qui apprend l'histoire, les produits et la voix d'une marque, puis répond aux clients 24/7 — sur le site web, dans les stands éphémères et dans le lien en bio.",
    },
    tags: ["AI Assistant", "SaaS", "Product Design"],
    link: "https://ava.techinnovation.consulting/",
    image: "/projects/ava-ai-assistant.png",
  },
  {
    title: {
      en: "Studio I AM Beauté — Content Repurposing",
      fr: "Studio I AM Beauté — Réutilisation de Contenu",
    },
    description: {
      en: "One 52-second video turned into 14+ pieces of content — Reels, carousels, stories, and web assets — in a dark editorial brand language.",
      fr: "Une vidéo de 52 secondes transformée en plus de 14 contenus — Reels, carrousels, stories et éléments web — dans un langage de marque éditorial sombre.",
    },
    tags: ["Content Strategy", "Social Media", "Web Design"],
    link: "https://iam-demo-zeta.vercel.app/",
    image: "/projects/iam-beaute-content.png",
  },
  {
    title: {
      en: "Black Wealth Crypto",
      fr: "Black Wealth Crypto",
    },
    description: {
      en: "A bilingual (FR/EN) crypto-education platform built on three pillars — Education, Experts, News — with a weekly newsletter.",
      fr: "Une plateforme bilingue (FR/EN) d'éducation crypto bâtie sur trois piliers — Éducation, Experts, Actualités — avec une newsletter hebdomadaire.",
    },
    tags: ["Web Platform", "Content Strategy", "Bilingual"],
    link: "https://blackwealthcrypto.com",
    image: "/projects/black-wealth-crypto.png",
  },
  {
    title: {
      en: "Les Mounas — Afro-Inspired Learning",
      fr: "Les Mounas — Apprentissage Afro-Inspiré",
    },
    description: {
      en: "An afro-inspired homeschool hub for ages 3–6, paired with a boutique of cultural plush toys.",
      fr: "Un centre d'apprentissage à domicile afro-inspiré pour les 3 à 6 ans, accompagné d'une boutique de peluches culturelles.",
    },
    tags: ["EdTech", "E-commerce", "Brand"],
    link: "https://lesmounas.school/",
    image: "/projects/les-mounas-learning.png",
  },
]

export function Projects() {
  const { language, t } = useLanguage()

  return (
    <section id="projects" className="section-padding bg-muted/30 relative overflow-hidden">
      <div className="geometric-shape geometric-triangle w-72 h-72 bg-primary/10 top-20 right-10 blur-3xl" />
      <div className="geometric-shape w-80 h-80 bg-quaternary/10 bottom-10 left-20 blur-3xl rounded-full" />

      <div className="container-custom relative z-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-center mb-16 text-balance">
          <span className="bg-gradient-to-r from-accent via-primary to-quaternary bg-clip-text text-transparent">
            {t.projects.title}
          </span>
        </h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {projects.map((project, index) => {
            const colors = [
              { border: "border-primary/30", accent: "bg-primary/10", text: "text-primary" },
              { border: "border-accent/30", accent: "bg-accent/10", text: "text-accent" },
              { border: "border-tertiary/30", accent: "bg-tertiary/10", text: "text-tertiary" },
              { border: "border-quaternary/30", accent: "bg-quaternary/10", text: "text-quaternary" },
            ]
            const color = colors[index % colors.length]

            return (
              <Card key={index} className={`overflow-hidden depth-card group border-2 ${color.border} relative`}>
                <div
                  className={`absolute top-0 right-0 w-20 h-20 ${color.accent} geometric-diamond opacity-30 -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform`}
                />

                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={project.image || "/placeholder.svg"}
                    alt={project.title[language]}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-6 space-y-4">
                  <h3 className={`text-xl font-bold font-display ${color.text}`}>{project.title[language]}</h3>
                  <p className="text-muted-foreground leading-relaxed">{project.description[language]}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className={`text-xs border ${color.border}`}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className={`gap-2 mt-4 w-full bg-transparent border-2 ${color.border} hover:${color.accent} group/btn`}
                  >
                    <a href={project.link} target="_blank" rel="noopener noreferrer">
                      {language === "en" ? "Learn More" : "En savoir plus"}
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
