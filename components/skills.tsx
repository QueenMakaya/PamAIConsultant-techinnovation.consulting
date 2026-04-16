"use client"

import { useLanguage } from "@/contexts/language-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Briefcase, Languages, ChevronDown } from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface SkillCategory {
  icon: typeof Code
  title: { en: string; fr: string }
  skills: string[]
}

const skillCategories: SkillCategory[] = [
  {
    icon: Code,
    title: { en: "Technical Skills", fr: "Compétences Techniques" },
    skills: [
      "Generative AI (GPT, Claude, etc.)",
      "n8n Automation",
      "Python, JavaScript",
      "API Integration",
      "No-Code/Low-Code Tools",
      "Data Analysis & Visualization",
      "Cloud Platforms (AWS, Azure)",
      "Database Management",
    ],
  },
  {
    icon: Briefcase,
    title: { en: "Business Skills", fr: "Compétences Métier" },
    skills: [
      "Digital Transformation Strategy",
      "Business Process Optimization",
      "Change Management",
      "Project Management",
      "Entrepreneurship Coaching",
      "Innovation Consulting",
      "Strategic Planning",
      "Stakeholder Management",
      "Training & Workshop Facilitation",
      "Business Model Innovation",
    ],
  },
]

const languages = [
  { name: "French", level: { en: "Native", fr: "Langue maternelle" } },
  { name: "English", level: { en: "Very Advanced", fr: "Très avancé" } },
  { name: "Spanish", level: { en: "Intermediate", fr: "Intermédiaire" } },
]

export function Skills() {
  const { language, t } = useLanguage()
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0])

  return (
    <section id="skills" className="section-padding relative overflow-hidden">
      <div className="geometric-shape geometric-hexagon w-80 h-80 bg-accent/10 top-10 left-10 blur-3xl" />
      <div className="geometric-shape geometric-diamond w-64 h-64 bg-quaternary/10 bottom-20 right-20 blur-2xl" />

      <div className="container-custom relative z-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-center mb-16 text-balance">
          <span className="bg-gradient-to-r from-primary via-accent to-tertiary bg-clip-text text-transparent">
            {t.skills.title}
          </span>
        </h2>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Technical and Business Skills */}
          <div className="grid md:grid-cols-2 gap-8">
            {skillCategories.map((category, index) => {
              const Icon = category.icon
              const colors = [
                {
                  bg: "bg-primary/10",
                  text: "text-primary",
                  border: "border-primary/20",
                  gradient: "from-primary/10 to-primary/5",
                },
                {
                  bg: "bg-accent/10",
                  text: "text-accent",
                  border: "border-accent/20",
                  gradient: "from-accent/10 to-accent/5",
                },
              ]
              const color = colors[index % colors.length]

              return (
                <Card
                  key={index}
                  className={`p-8 depth-card gradient-border bg-gradient-to-br ${color.gradient} border-2 ${color.border} relative overflow-hidden`}
                >
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 ${color.bg} geometric-hexagon opacity-20 -translate-y-1/2 translate-x-1/2`}
                  />

                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className={`p-3 ${color.bg} rounded-lg`}>
                      <Icon className={`h-6 w-6 ${color.text}`} />
                    </div>
                    <h3 className="text-2xl font-bold font-display">{category.title[language]}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 relative z-10">
                    {category.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className={`text-sm py-1.5 ${color.border} hover:${color.bg} transition-colors`}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Languages - Dropdown */}
          <Card className="p-8 depth-card gradient-border bg-gradient-to-br from-tertiary/10 to-tertiary/5 border-2 border-tertiary/20 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-tertiary/10 geometric-diamond opacity-20 translate-y-1/2 -translate-x-1/2" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-3 bg-tertiary/10 rounded-lg">
                <Languages className="h-6 w-6 text-tertiary" />
              </div>
              <h3 className="text-2xl font-bold font-display">{t.skills.languages}</h3>
            </div>

            <div className="relative z-10 max-w-md">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between border-2 border-tertiary/20 hover:border-tertiary/40 bg-card/50 backdrop-blur-sm h-auto py-4"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{selectedLanguage.name}</span>
                      <Badge className="bg-tertiary/20 text-tertiary border-tertiary/30">
                        {selectedLanguage.level[language]}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[400px]">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.name}
                      onClick={() => setSelectedLanguage(lang)}
                      className="flex items-center justify-between p-4 cursor-pointer"
                    >
                      <span className="font-medium">{lang.name}</span>
                      <Badge className="bg-tertiary/20 text-tertiary border-tertiary/30">{lang.level[language]}</Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
