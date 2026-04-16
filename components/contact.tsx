"use client"

import type React from "react"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Linkedin, Send, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function Contact() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name")
    const email = formData.get("email")
    const message = formData.get("message")

    const mailtoLink = `mailto:contact@techinovation.consulting?subject=Contact from ${name}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    )}`

    window.location.href = mailtoLink

    toast({
      title: "Opening email client...",
      description: "Your default email client will open with the message.",
    })

    setIsSubmitting(false)
  }

  return (
    <section id="contact" className="section-padding">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 text-balance">
            {t.contact.title}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground text-pretty">{t.contact.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Contact Form */}
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  {t.contact.name}
                </label>
                <Input id="name" name="name" required placeholder="John Doe" />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  {t.contact.email}
                </label>
                <Input id="email" name="email" type="email" required placeholder="john@example.com" />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  {t.contact.message}
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  placeholder={t.contact.message}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {t.contact.send}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t.contact.send}
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="p-8">
              <h3 className="text-xl font-bold font-display mb-6">{t.contact.or}</h3>
              <div className="space-y-4">
                <a
                  href="mailto:contact@techinovation.consulting"
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">contact@techinovation.consulting</p>
                  </div>
                </a>

                <a
                  href="https://wa.me/14384554448"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-3 bg-tertiary/10 rounded-lg group-hover:bg-tertiary/20 transition-colors">
                    <MessageCircle className="h-5 w-5 text-tertiary" />
                  </div>
                  <div>
                    <p className="font-medium">{t.contact.whatsapp}</p>
                    <p className="text-sm text-muted-foreground">{t.contact.chatOnWhatsApp}</p>
                  </div>
                </a>

                <a
                  href="https://www.linkedin.com/in/alfredpamela/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                    <Linkedin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">LinkedIn</p>
                    <p className="text-sm text-muted-foreground">linkedin.com/in/alfredpamela</p>
                  </div>
                </a>
              </div>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5">
              <h3 className="text-xl font-bold font-display mb-4">Let's Collaborate</h3>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're looking to integrate AI into your business, automate workflows, or need strategic
                guidance on digital transformation, I'm here to help turn your vision into reality.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
