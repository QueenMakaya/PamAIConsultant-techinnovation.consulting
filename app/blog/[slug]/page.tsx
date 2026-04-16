"use client"

import { useLanguage } from "@/contexts/language-context"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react"
import { getBlogPostBySlug } from "@/lib/blog-data"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"

export default function BlogPostPage() {
  const { language } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const slug = params.slug as string

  const post = getBlogPostBySlug(slug)

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{language === "en" ? "Post Not Found" : "Article non trouvé"}</h1>
          <Button onClick={() => router.push("/blog")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === "en" ? "Back to Blog" : "Retour au Blog"}
          </Button>
        </div>
      </div>
    )
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title[language],
        text: post.excerpt[language],
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: language === "en" ? "Link Copied!" : "Lien copié!",
        description: language === "en" ? "The link has been copied to your clipboard." : "Le lien a été copié.",
      })
    }
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="pt-32 pb-20">
        <div className="container-custom max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => router.push("/blog")} className="mb-8 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {language === "en" ? "Back to Blog" : "Retour au Blog"}
          </Button>

          {/* Hero Image */}
          <div className="aspect-video overflow-hidden rounded-2xl mb-8">
            <img
              src={post.image || "/placeholder.svg"}
              alt={post.title[language]}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(post.date).toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
              </div>
              <Badge className="bg-primary/10 text-primary">{post.category[language]}</Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">{post.title[language]}</h1>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={post.author.avatar || "/placeholder.svg"}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{post.author.name}</p>
                  <p className="text-sm text-muted-foreground">{post.author.role[language]}</p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 bg-transparent">
                <Share2 className="h-4 w-4" />
                {language === "en" ? "Share" : "Partager"}
              </Button>
            </div>
          </div>

          {/* Article Content */}
          <Card className="p-8 md:p-12 prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold font-display mb-4 mt-8">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-bold font-display mb-3 mt-6">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-bold font-display mb-2 mt-4">{children}</h3>,
                p: ({ children }) => <p className="text-foreground/90 leading-relaxed mb-4">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                li: ({ children }) => <li className="text-foreground/90">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic my-4">{children}</blockquote>
                ),
              }}
            >
              {post.content[language]}
            </ReactMarkdown>
          </Card>

          {/* Tags */}
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          {/* CTA */}
          <Card className="mt-12 p-8 bg-gradient-to-br from-primary/5 to-tertiary/5 text-center">
            <h3 className="text-2xl font-bold font-display mb-4">
              {language === "en" ? "Ready to Transform Your Business?" : "Prêt à transformer votre entreprise?"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {language === "en"
                ? "Let's discuss how AI and digital transformation can help you achieve your goals."
                : "Discutons de la façon dont l'IA et la transformation numérique peuvent vous aider à atteindre vos objectifs."}
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/#contact")}
              className="bg-gradient-to-r from-primary to-tertiary hover:opacity-90"
            >
              {language === "en" ? "Get in Touch" : "Contactez-moi"}
            </Button>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
