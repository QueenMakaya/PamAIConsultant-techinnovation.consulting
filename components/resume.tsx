"use client"

import { useLanguage } from "@/contexts/language-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, GraduationCap, Award, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { experiences, education, certifications } from "@/lib/data"

export function Resume() {
  const { language, t } = useLanguage()
  const [currentExpIndex, setCurrentExpIndex] = useState(0)
  const [currentEduIndex, setCurrentEduIndex] = useState(0)

  const currentExperiences = experiences[language]
  const currentEducation = education[language]

  const nextExperience = () => {
    setCurrentExpIndex((prev) => (prev + 1) % currentExperiences.length)
  }

  const prevExperience = () => {
    setCurrentExpIndex((prev) => (prev - 1 + currentExperiences.length) % currentExperiences.length)
  }

  const nextEducation = () => {
    setCurrentEduIndex((prev) => (prev + 1) % currentEducation.length)
  }

  const prevEducation = () => {
    setCurrentEduIndex((prev) => (prev - 1 + currentEducation.length) % currentEducation.length)
  }

  return (
    <section id="resume" className="section-padding relative overflow-hidden">
      <div className="geometric-shape geometric-hexagon w-96 h-96 bg-primary/5 top-0 right-0 blur-3xl" />
      <div className="geometric-shape geometric-diamond w-72 h-72 bg-accent/5 bottom-0 left-0 blur-3xl" />

      <div className="container-custom relative z-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-center mb-16 text-balance">
          <span className="bg-gradient-to-r from-tertiary via-primary to-accent bg-clip-text text-transparent">
            {t.resume.title}
          </span>
        </h2>

        <div className="max-w-5xl mx-auto space-y-16">
          {/* Experience - Carousel */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/20">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold font-display">{t.resume.experience}</h3>
            </div>

            <div className="relative">
              <Card className="p-6 md:p-8 depth-card border-l-4 border-l-primary/50 hover:border-l-primary transition-colors min-h-[400px]">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold font-display mb-2">{currentExperiences[currentExpIndex].title}</h4>
                    <p className="text-muted-foreground font-medium">
                      {currentExperiences[currentExpIndex].company} • {currentExperiences[currentExpIndex].location}
                    </p>
                  </div>
                  <Badge variant="secondary" className="self-start whitespace-nowrap">
                    {currentExperiences[currentExpIndex].period}
                  </Badge>
                </div>
                <ul className="space-y-2">
                  {currentExperiences[currentExpIndex].description.map((item, i) => (
                    <li key={i} className="text-muted-foreground leading-relaxed flex gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <div className="flex items-center justify-center gap-4 mt-6">
                <Button variant="outline" size="icon" onClick={prevExperience} className="rounded-full bg-transparent">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">
                  {currentExperiences.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentExpIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentExpIndex ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                      }`}
                      aria-label={`Go to experience ${index + 1}`}
                    />
                  ))}
                </div>
                <Button variant="outline" size="icon" onClick={nextExperience} className="rounded-full bg-transparent">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Education - Carousel */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg border border-accent/20">
                <GraduationCap className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold font-display">{t.resume.education}</h3>
            </div>

            <div className="relative">
              <Card className="p-6 md:p-8 depth-card border-l-4 border-l-accent/50 hover:border-l-accent transition-colors min-h-[200px]">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold font-display mb-2">{currentEducation[currentEduIndex].degree}</h4>
                    <p className="text-muted-foreground font-medium">{currentEducation[currentEduIndex].institution}</p>
                  </div>
                  <Badge variant="secondary" className="self-start">
                    {currentEducation[currentEduIndex].year}
                  </Badge>
                </div>
              </Card>

              <div className="flex items-center justify-center gap-4 mt-6">
                <Button variant="outline" size="icon" onClick={prevEducation} className="rounded-full bg-transparent">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">
                  {currentEducation.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentEduIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentEduIndex ? "w-8 bg-accent" : "w-2 bg-muted-foreground/30"
                      }`}
                      aria-label={`Go to education ${index + 1}`}
                    />
                  ))}
                </div>
                <Button variant="outline" size="icon" onClick={nextEducation} className="rounded-full bg-transparent">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-tertiary/20 to-tertiary/10 rounded-lg border border-tertiary/20">
                <Award className="h-6 w-6 text-tertiary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold font-display">{t.resume.certifications}</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {certifications.map((cert, index) => {
                const colors = [
                  "border-l-primary/50 hover:border-l-primary",
                  "border-l-accent/50 hover:border-l-accent",
                  "border-l-tertiary/50 hover:border-l-tertiary",
                ]
                const color = colors[index % colors.length]

                return (
                  <Card key={index} className={`p-6 depth-card border-l-4 ${color} transition-colors`}>
                    <h4 className="font-bold mb-1">{cert.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {cert.issuer} • {cert.year}
                    </p>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
