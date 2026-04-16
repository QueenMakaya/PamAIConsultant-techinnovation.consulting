export type Language = "en" | "fr"

export const translations = {
  en: {
    nav: {
      about: "About",
      company: "Company",
      resume: "Resume",
      projects: "Projects",
      skills: "Skills",
      testimonials: "Testimonials",
      blog: "Blog",
      contact: "Contact",
    },
    hero: {
      greeting: "Hello, I'm",
      title: "Digital Transformation & AI Consultant",
      subtitle:
        "Expert in strategic innovation, entrepreneurship coaching, and developing digital solutions integrating artificial intelligence.",
      cta: "Get in Touch",
      downloadCV: "Download CV",
    },
    about: {
      title: "About Me",
      description:
        "With international experience spanning Canada and Africa, I help businesses, nonprofits, and institutions digitalize their processes, develop AI tools (automation, no-code, NLP, generative AI), and train teams in strategic adoption of emerging technologies.",
      innovation: "Innovation",
      innovationDesc: "Cutting-edge AI solutions for modern challenges",
      efficiency: "Efficiency",
      efficiencyDesc: "Streamlined automation and digital transformation",
      results: "Results",
      resultsDesc: "Measurable impact on business growth",
    },
    company: {
      title: "Tech Innovation Consulting",
      subtitle: "Innovation & Entrepreneurship Specialists",
      founded: "Founded in 2019",
      description:
        "Tech Innovation Consulting is a specialized consulting firm dedicated to helping businesses and entrepreneurs harness the power of innovation and emerging technologies. We focus on strategic innovation, digital transformation, and entrepreneurship development across Canada and Africa.",
      mission: "Our Mission",
      missionText:
        "To empower businesses and entrepreneurs with cutting-edge technology solutions and strategic guidance, enabling them to thrive in the digital age through innovation, automation, and AI integration.",
      services: "Our Services",
      service1: "Innovation Strategy & Digital Transformation",
      service2: "AI Integration & Automation Solutions",
      service3: "Entrepreneurship Coaching & Business Development",
      service4: "No-Code/Low-Code Solution Development",
    },
    resume: {
      title: "Experience & Education",
      experience: "Professional Experience",
      education: "Education",
      certifications: "Certifications In Artificial Intelligence",
      present: "Present",
    },
    projects: {
      title: "Featured Projects",
      viewProject: "View Project",
    },
    skills: {
      title: "Skills & Expertise",
      technical: "Technical Skills",
      business: "Business Skills",
      languages: "Languages",
    },
    testimonials: {
      title: "Testimonials",
      previous: "Previous",
      next: "Next",
    },
    contact: {
      title: "Let's Work Together",
      subtitle: "Ready to transform your business with AI and digital innovation?",
      name: "Name",
      email: "Email",
      message: "Message",
      send: "Send Message",
      or: "Or reach me directly",
      whatsapp: "WhatsApp",
      chatOnWhatsApp: "Chat on WhatsApp",
    },
    footer: {
      rights: "All rights reserved",
    },
  },
  fr: {
    nav: {
      about: "À propos",
      company: "Entreprise",
      resume: "Parcours",
      projects: "Projets",
      skills: "Compétences",
      testimonials: "Témoignages",
      blog: "Blog",
      contact: "Contact",
    },
    hero: {
      greeting: "Bonjour, je suis",
      title: "Consultante en Transformation Numérique et Intelligence Artificielle",
      subtitle:
        "Experte en innovation stratégique, en accompagnement d'entrepreneurs, et en développement de solutions numériques intégrant l'intelligence artificielle.",
      cta: "Me Contacter",
      downloadCV: "Télécharger CV",
    },
    about: {
      title: "À Propos",
      description:
        "Forte d'une expérience internationale (Canada – Afrique), j'accompagne les entreprises, OBNL et institutions dans la digitalisation de leurs processus, le développement d'outils IA (automatisation, no-code, NLP, IA générative), et la formation à l'adoption stratégique des technologies émergentes.",
      innovation: "Innovation",
      innovationDesc: "Solutions IA de pointe pour les défis modernes",
      efficiency: "Efficacité",
      efficiencyDesc: "Automatisation rationalisée et transformation numérique",
      results: "Résultats",
      resultsDesc: "Impact mesurable sur la croissance de l'entreprise",
    },
    company: {
      title: "Tech Innovation Consulting",
      subtitle: "Spécialistes en Innovation et Entrepreneuriat",
      founded: "Fondée en 2019",
      description:
        "Tech Innovation Consulting est une firme de conseil spécialisée dédiée à aider les entreprises et entrepreneurs à exploiter le pouvoir de l'innovation et des technologies émergentes. Nous nous concentrons sur l'innovation stratégique, la transformation numérique et le développement entrepreneurial au Canada et en Afrique.",
      mission: "Notre Mission",
      missionText:
        "Autonomiser les entreprises et entrepreneurs avec des solutions technologiques de pointe et des conseils stratégiques, leur permettant de prospérer à l'ère numérique grâce à l'innovation, l'automatisation et l'intégration de l'IA.",
      services: "Nos Services",
      service1: "Stratégie d'Innovation & Transformation Numérique",
      service2: "Intégration IA & Solutions d'Automatisation",
      service3: "Coaching Entrepreneurial & Développement d'Affaires",
      service4: "Développement de Solutions No-Code/Low-Code",
    },
    resume: {
      title: "Expérience & Formation",
      experience: "Expérience Professionnelle",
      education: "Formation",
      certifications: "Certifications en Intelligence Artificielle",
      present: "Présent",
    },
    projects: {
      title: "Projets Phares",
      viewProject: "Voir le Projet",
    },
    skills: {
      title: "Compétences & Expertise",
      technical: "Compétences Techniques",
      business: "Compétences Métier",
      languages: "Langues",
    },
    testimonials: {
      title: "Témoignages",
      previous: "Précédent",
      next: "Suivant",
    },
    contact: {
      title: "Travaillons Ensemble",
      subtitle: "Prêt à transformer votre entreprise avec l'IA et l'innovation numérique?",
      name: "Nom",
      email: "Email",
      message: "Message",
      send: "Envoyer",
      or: "Ou contactez-moi directement",
      whatsapp: "WhatsApp",
      chatOnWhatsApp: "Discuter sur WhatsApp",
    },
    footer: {
      rights: "Tous droits réservés",
    },
  },
}

export function getTranslation(lang: Language) {
  return translations[lang]
}
