"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Language, getTranslation } from "@/lib/i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: ReturnType<typeof getTranslation>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [t, setT] = useState(() => getTranslation("en"))

  useEffect(() => {
    // Load language preference from localStorage
    const savedLang = localStorage.getItem("language") as Language
    if (savedLang && (savedLang === "en" || savedLang === "fr")) {
      setLanguageState(savedLang)
      setT(getTranslation(savedLang))
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setT(getTranslation(lang))
    localStorage.setItem("language", lang)
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
