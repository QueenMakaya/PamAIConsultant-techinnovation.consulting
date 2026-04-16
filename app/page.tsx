import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Company } from "@/components/company"
import { Resume } from "@/components/resume"
import { Projects } from "@/components/projects"
import { Skills } from "@/components/skills"
import { Testimonials } from "@/components/testimonials"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { ScrollToTop } from "@/components/scroll-to-top"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <About />
      <Company />
      <Resume />
      <Projects />
      <Skills />
      <Testimonials />
      <Contact />
      <Footer />
      <ScrollToTop />
    </main>
  )
}
