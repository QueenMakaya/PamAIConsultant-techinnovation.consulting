"use client"

import { useLanguage } from "@/contexts/language-context"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useMemo } from "react"
import { blogPosts } from "@/lib/blog-data"
import Link from "next/link"

export default function BlogPage() {
  const { language } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")

  const pageTitle = {
    en: "Blog & Insights",
    fr: "Blog & Perspectives",
  }

  const pageSubtitle = {
    en: "Thoughts on AI, digital transformation, and entrepreneurship",
    fr: "Réflexions sur l'IA, la transformation numérique et l'entrepreneuriat",
  }

  const searchPlaceholder = {
    en: "Search articles...",
    fr: "Rechercher des articles...",
  }

  const readMore = {
    en: "Read More",
    fr: "Lire Plus",
  }

  const noResults = {
    en: "No articles found matching your search.",
    fr: "Aucun article trouvé correspondant à votre recherche.",
  }

  // Filter blog posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return blogPosts

    const query = searchQuery.toLowerCase()
    return blogPosts.filter((post) => {
      const title = post.title[language].toLowerCase()
      const excerpt = post.excerpt[language].toLowerCase()
      const category = post.category[language].toLowerCase()
      const tags = post.tags.join(" ").toLowerCase()

      return title.includes(query) || excerpt.includes(query) || category.includes(query) || tags.includes(query)
    })
  }, [searchQuery, language])

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="pt-32 pb-20">
        <div className="container-custom">
          {/* Header */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-6 text-balance">
              <span className="bg-gradient-to-r from-primary via-tertiary to-accent bg-clip-text text-transparent">
                {pageTitle[language]}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8">{pageSubtitle[language]}</p>

            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchPlaceholder[language]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Blog Posts Grid */}
          {filteredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {filteredPosts.map((post, index) => {
                const colors = [
                  { border: "border-primary/20", accent: "bg-primary/5", badge: "bg-primary/10 text-primary" },
                  { border: "border-tertiary/20", accent: "bg-tertiary/5", badge: "bg-tertiary/10 text-tertiary" },
                  { border: "border-accent/20", accent: "bg-accent/5", badge: "bg-accent/10 text-accent" },
                  {
                    border: "border-quaternary/20",
                    accent: "bg-quaternary/5",
                    badge: "bg-quaternary/10 text-quaternary",
                  },
                ]
                const color = colors[index % colors.length]

                return (
                  <Card
                    key={post.id}
                    className={`overflow-hidden depth-card border-2 ${color.border} ${color.accent} hover:scale-[1.02] transition-transform duration-300`}
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.image || "/placeholder.svg"}
                        alt={post.title[language]}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(post.date).toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>

                      <Badge className={`mb-3 ${color.badge}`}>{post.category[language]}</Badge>

                      <h2 className="text-xl font-bold font-display mb-3 leading-snug">{post.title[language]}</h2>

                      <p className="text-muted-foreground leading-relaxed mb-4">{post.excerpt[language]}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="ghost" className="gap-2 p-0 h-auto hover:gap-3 transition-all">
                          {readMore[language]}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center">
              <Card className="p-12 bg-gradient-to-br from-muted/50 to-muted/30">
                <p className="text-muted-foreground text-lg">{noResults[language]}</p>
              </Card>
            </div>
          )}

          {/* Coming Soon Message */}
          {filteredPosts.length > 0 && (
            <div className="max-w-2xl mx-auto mt-16 text-center">
              <Card className="p-8 bg-gradient-to-br from-primary/5 to-tertiary/5">
                <p className="text-muted-foreground">
                  {language === "en"
                    ? "More articles coming soon! Subscribe to stay updated on the latest insights in AI, digital transformation, and entrepreneurship."
                    : "Plus d'articles à venir bientôt ! Abonnez-vous pour rester informé des dernières perspectives en IA, transformation numérique et entrepreneuriat."}
                </p>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
