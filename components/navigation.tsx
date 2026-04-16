"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Globe, Menu, X, Home } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function Navigation() {
  const { language, setLanguage, t } = useLanguage()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { label: t.nav.about, href: "#about" },
    { label: t.nav.company, href: "#company" },
    { label: t.nav.resume, href: "#resume" },
    { label: t.nav.projects, href: "#projects" },
    { label: t.nav.skills, href: "#skills" },
    { label: t.nav.testimonials, href: "#testimonials" },
    { label: t.nav.blog, href: "/blog" },
    { label: t.nav.contact, href: "#contact" },
  ]

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en")
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm" : "bg-transparent",
      )}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Home className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm hidden sm:inline">{language === "en" ? "Home" : "Accueil"}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2" aria-label="Toggle language">
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
