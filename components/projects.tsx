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
      en: "AI-Powered Customer Service Automation",
      fr: "Automatisation du Service Client par IA",
    },
    description: {
      en: "Developed an intelligent chatbot using NLP and generative AI to handle customer inquiries, reducing response time by 70% and improving customer satisfaction.",
      fr: "Développement d'un chatbot intelligent utilisant le NLP et l'IA générative pour gérer les demandes clients, réduisant le temps de réponse de 70% et améliorant la satisfaction client.",
    },
    tags: ["NLP", "Generative AI", "Python", "n8n"],
    image: "/ai-chatbot-dashboard.png",
  },
  {
    title: {
      en: "Business Process Automation Platform",
      fr: "Plateforme d'Automatisation des Processus Métier",
    },
    description: {
      en: "Built a comprehensive automation platform using n8n to streamline operations for a nonprofit, automating data collection, reporting, and communication workflows.",
      fr: "Construction d'une plateforme d'automatisation complète avec n8n pour rationaliser les opérations d'un OBNL, automatisant la collecte de données, les rapports et les flux de communication.",
    },
    tags: ["n8n", "Automation", "API Integration", "No-Code"],
    image: "/workflow-automation-dashboard.png",
  },
  {
    title: {
      en: "Digital Transformation Strategy for SME",
      fr: "Stratégie de Transformation Numérique pour PME",
    },
    description: {
      en: "Led a complete digital transformation initiative for a manufacturing company, implementing AI-driven inventory management and predictive maintenance systems.",
      fr: "Direction d'une initiative complète de transformation numérique pour une entreprise manufacturière, implémentant la gestion des stocks par IA et des systèmes de maintenance prédictive.",
    },
    tags: ["Strategy", "AI", "IoT", "Change Management"],
    image: "/digital-transformation-business-analytics.jpg",
  },
  {
    title: {
      en: "Entrepreneurship Training Program",
      fr: "Programme de Formation en Entrepreneuriat",
    },
    description: {
      en: "Designed and delivered a comprehensive training program on AI adoption for entrepreneurs, helping 50+ startups integrate AI into their business models.",
      fr: "Conception et livraison d'un programme de formation complet sur l'adoption de l'IA pour entrepreneurs, aidant plus de 50 startups à intégrer l'IA dans leurs modèles d'affaires.",
    },
    tags: ["Training", "AI Strategy", "Coaching", "Innovation"],
    image: "/business-training-workshop-presentation.jpg",
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
                    variant="outline"
                    size="sm"
                    className={`gap-2 mt-4 w-full bg-transparent border-2 ${color.border} hover:${color.accent} group/btn`}
                  >
                    {language === "en" ? "Learn More" : "En savoir plus"}
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
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
