"use client"

import type React from "react"

import { useLanguage } from "@/contexts/language-context"
import { Linkedin, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function Footer() {
  const { t, language } = useLanguage()
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState("")
  const { toast } = useToast()

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      toast({
        title: language === "en" ? "Subscribed!" : "Abonné!",
        description:
          language === "en"
            ? "Thank you for subscribing to our newsletter."
            : "Merci de vous être abonné à notre newsletter.",
      })
      setEmail("")
    }
  }

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto mb-12">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold font-display mb-2">
              {language === "en" ? "Subscribe to Newsletter" : "Abonnez-vous à la Newsletter"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === "en"
                ? "Get the latest insights on AI, digital transformation, and entrepreneurship."
                : "Recevez les dernières perspectives sur l'IA, la transformation numérique et l'entrepreneuriat."}
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder={language === "en" ? "Enter your email" : "Entrez votre email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" className="bg-gradient-to-r from-primary to-tertiary hover:opacity-90">
              {language === "en" ? "Subscribe" : "S'abonner"}
            </Button>
          </form>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-2xl font-bold font-display text-primary mb-2">Pamela Alfred</p>
            <p className="text-sm text-muted-foreground">
              © {currentYear} Pamela Alfred. {t.footer.rights}.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="mailto:contact@techinovation.consulting"
              className="p-3 bg-background rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/alfredpamela/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-background rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com/pamelaalfred"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-background rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="Instagram"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.057-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
