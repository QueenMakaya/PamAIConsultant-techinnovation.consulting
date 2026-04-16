"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Quote, ChevronLeft, ChevronRight } from "lucide-react"

interface Testimonial {
  name: string
  role: { en: string; fr: string }
  company: string
  content: { en: string; fr: string }
  avatar: string
}

const testimonials: Testimonial[] = [
  {
    name: "Jean-Marc Dubois",
    role: {
      en: "CEO, TechStart Inc.",
      fr: "PDG, TechStart Inc.",
    },
    company: "TechStart Inc.",
    content: {
      en: "Pamela transformed our business operations with her AI automation solutions. Her expertise in n8n and generative AI helped us reduce operational costs by 40% while improving service quality. Highly recommended!",
      fr: "Pamela a transformé nos opérations commerciales avec ses solutions d'automatisation IA. Son expertise en n8n et IA générative nous a aidés à réduire les coûts opérationnels de 40% tout en améliorant la qualité du service. Hautement recommandée!",
    },
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    name: "Sarah Johnson",
    role: {
      en: "Director of Innovation, Global Nonprofit",
      fr: "Directrice de l'Innovation, OBNL Global",
    },
    company: "Global Nonprofit",
    content: {
      en: "Working with Pamela was a game-changer for our organization. She not only implemented cutting-edge AI tools but also trained our team to use them effectively. Her coaching approach is both practical and inspiring.",
      fr: "Travailler avec Pamela a été un tournant pour notre organisation. Elle a non seulement implémenté des outils IA de pointe, mais a également formé notre équipe à les utiliser efficacement. Son approche de coaching est à la fois pratique et inspirante.",
    },
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    name: "Mohamed Diallo",
    role: {
      en: "Founder, AfriTech Solutions",
      fr: "Fondateur, AfriTech Solutions",
    },
    company: "AfriTech Solutions",
    content: {
      en: "Pamela's strategic guidance was instrumental in our digital transformation journey. Her deep understanding of both technology and business helped us navigate complex challenges and achieve remarkable results.",
      fr: "Les conseils stratégiques de Pamela ont été déterminants dans notre parcours de transformation numérique. Sa compréhension approfondie de la technologie et des affaires nous a aidés à naviguer des défis complexes et à obtenir des résultats remarquables.",
    },
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    name: "Marie Tremblay",
    role: {
      en: "Operations Manager, Manufacturing Co.",
      fr: "Gestionnaire des Opérations, Manufacturing Co.",
    },
    company: "Manufacturing Co.",
    content: {
      en: "The automation platform Pamela built for us has revolutionized our workflow. What used to take days now takes hours. Her attention to detail and commitment to our success was exceptional.",
      fr: "La plateforme d'automatisation que Pamela a construite pour nous a révolutionné notre flux de travail. Ce qui prenait des jours ne prend maintenant que des heures. Son attention aux détails et son engagement envers notre succès ont été exceptionnels.",
    },
    avatar: "/placeholder.svg?height=100&width=100",
  },
]

export function Testimonials() {
  const { language, t } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const previousTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const colors = [
    { quote: "text-primary/20", border: "border-primary/20", accent: "bg-primary/5" },
    { quote: "text-accent/20", border: "border-accent/20", accent: "bg-accent/5" },
    { quote: "text-tertiary/20", border: "border-tertiary/20", accent: "bg-tertiary/5" },
    { quote: "text-quaternary/20", border: "border-quaternary/20", accent: "bg-quaternary/5" },
  ]
  const color = colors[currentIndex % colors.length]
  const testimonial = testimonials[currentIndex]

  return (
    <section id="testimonials" className="section-padding bg-muted/30 relative overflow-hidden">
      <div className="geometric-shape geometric-hexagon w-96 h-96 bg-tertiary/10 top-10 left-10 blur-3xl" />
      <div className="geometric-shape geometric-triangle w-64 h-64 bg-quaternary/10 bottom-20 right-20 blur-2xl" />
      <div className="geometric-shape w-80 h-80 bg-accent/5 top-1/2 right-1/3 blur-3xl rounded-full" />

      <div className="container-custom relative z-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-center mb-16 text-balance">
          <span className="bg-gradient-to-r from-quaternary via-tertiary to-primary bg-clip-text text-transparent">
            {t.testimonials.title}
          </span>
        </h2>

        <div className="max-w-4xl mx-auto">
          <Card className={`p-8 md:p-12 depth-card relative border-2 ${color.border} ${color.accent} backdrop-blur-sm`}>
            <Quote className={`absolute top-6 right-6 h-12 w-12 ${color.quote}`} />
            <div
              className={`absolute bottom-0 left-0 w-24 h-24 ${color.quote.replace("/20", "/10")} geometric-diamond -translate-x-1/2 translate-y-1/2`}
            />

            <div className="flex flex-col items-center text-center gap-6 relative z-10">
              <Avatar className="h-20 w-20 ring-4 ring-offset-4 ring-offset-card ring-primary/20">
                <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                <AvatarFallback className="text-2xl">{testimonial.name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div>
                <h4 className="font-bold text-xl mb-1">{testimonial.name}</h4>
                <p className="text-sm text-muted-foreground">{testimonial.role[language]}</p>
              </div>

              <p className="text-muted-foreground leading-relaxed italic text-lg max-w-2xl">
                "{testimonial.content[language]}"
              </p>
            </div>
          </Card>

          {/* Carousel Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button variant="outline" size="icon" onClick={previousTestimonial} aria-label={t.testimonials.previous}>
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button variant="outline" size="icon" onClick={nextTestimonial} aria-label={t.testimonials.next}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
