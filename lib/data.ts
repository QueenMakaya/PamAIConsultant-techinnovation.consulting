export interface Experience {
  title: string
  company: string
  location: string
  period: string
  description: string[]
  current?: boolean
}

export interface Education {
  degree: string
  institution: string
  year: string
}

export interface Project {
  title: string
  description: string
  image: string
  tags: string[]
  link?: string
}

export interface Skill {
  name: string
  level: number // 1-10
  category: "technical" | "business" | "language"
}

export interface Testimonial {
  name: string
  role: string
  company: string
  quote: string
  avatar: string
}

export const personalInfo = {
  name: "Pamela Alfred",
  email: "contact@techinovation.consulting",
  phone: "+1 438 455 4448",
  linkedin: "https://www.linkedin.com/in/alfredpamela/",
  github: "https://github.com/pamelaalfred",
  whatsapp: "https://wa.me/14384554448",
  location: "Montreal, Canada",
}

export const experiences: { en: Experience[]; fr: Experience[] } = {
  en: [
    {
      title: "Project Manager / Entrepreneurship Advisor",
      company: "CHAFRIC (Chantier d'Afrique du Canada)",
      location: "Montreal, Canada",
      period: "Feb 2024 - Present | Dec 2021 - Jun 2022",
      current: true,
      description: [
        "Advising and supporting entrepreneurs in business model development",
        "Strategic planning for startup launch and business management",
        "Funding research and financial dossier preparation",
        "Organizing promotional activities, visibility, and networking events",
        "Strategic monitoring of new trends in entrepreneurship and emerging technologies",
        "Periodic reporting of activities and projects",
      ],
    },
    {
      title: "Business & Tech Consultant",
      company: "Tech Innovation Consulting",
      location: "Canada/Africa",
      period: "Mar 2019 - Present",
      current: true,
      description: [
        "Capturing project needs and translating them into commercial and digital solutions across various sectors",
        "Designing and developing client strategies around digital solutions",
        "Implementing prototyping, testing, and integration phases for all stakeholders",
        "Managing key stakeholders and major project actors",
        "Understanding and translating client needs into business and technology solutions",
        "Designing and supporting projects integrating generative AI (ChatGPT, DALL-E, n8n automation)",
        "Developing MVPs with no-code AI tools for entrepreneurs (Africa & Canada)",
      ],
    },
    {
      title: "Founder",
      company: "Les Mounas",
      location: "Montreal, Canada",
      period: "Jun 2022 - Present",
      current: true,
      description: [
        "Complete business creation and management: product design, marketing, e-commerce, and financing",
        "Developing strategies for brand development and digital presence",
        "Building strategic partnerships in China and Africa to expand sourcing and production",
        "B2B market expansion targeting collaborations with boutiques, bookstores, and distributors",
        "Development of intelligent virtual seller (AI avatar + cloned voice)",
      ],
    },
    {
      title: "Facilitator and Mentor (Fr & Eng)",
      company: "African Management Institute (AMI)",
      location: "Multiple African Countries",
      period: "Nov 2020 - Present",
      current: true,
      description: [
        "Workshop preparation and facilitation",
        "Mentoring and advising entrepreneurs",
        "Providing practical tools and training for ambitious businesses across Africa",
      ],
    },
    {
      title: "Incubation Project Manager",
      company: "ESP (Entrepreneurial Solutions Partners)",
      location: "Côte d'Ivoire / Rwanda",
      period: "Aug 2019 - Apr 2020",
      description: [
        "Developing strategy, action plans, and scheduling in partnership with teams and partners",
        "Monitoring compliance with agreements with various partners and sponsors",
        "Tracking and evaluating needs and progress of incubated entrepreneurs",
        "Defining and establishing internal business processes",
        "Implementing technological tools for mobilization, recruitment, analysis, and project selection",
        "Evaluating program results and presenting findings, lessons learned, and recommendations",
        "Managing Orange Corner - Abidjan (Côte d'Ivoire) and Tourism Inc. - Kigali (Rwanda) programs",
      ],
    },
    {
      title: "Director of Operations - AI Incubation Program",
      company: "Creative Destruction Lab @ HEC Montreal",
      location: "Toronto & Montreal, Canada",
      period: "Apr 2018 - Mar 2019",
      description: [
        "Responsible for CDL implementation and overall program operations management at HEC Montreal",
        "Developed project management system, implemented internal technology stack, and documented all new CDL processes",
        "Established international recruitment strategy for AI startups",
        "Developed and integrated recruitment tools, project analysis, and program management",
        "Applied analytical tools and evaluation frameworks to assess startup relevance",
        "Team management and training",
        "Managed review, interview, and final selection process for each cohort",
        "Responsible for reporting, consulting, and program success",
        "Recruited and supported startups in applied artificial intelligence (health, finance, marketing)",
        "Collaborated with researchers, mentors, and investors specialized in deeptech and AI",
        "Defined and managed KPIs related to AI projects",
      ],
    },
    {
      title: "Community Lead & Expansion Manager",
      company: "Lighthouse Labs",
      location: "Montreal, Canada",
      period: "Aug 2017 - Apr 2018",
      description: [
        "Led development and expansion of the program in Montreal",
        "Responsible for all key performance indicators",
        "Managed and executed program operations strategy",
        "Monthly monitoring of program-related expenses",
        "Prepared KPI reports on monthly and quarterly basis",
        "Developed partnerships and growth initiatives aligned with brand and program mission",
        "Developed and maintained company culture",
      ],
    },
    {
      title: "Co-founder & CEO",
      company: "Ask PAM",
      location: "Montreal, Canada",
      period: "Mar 2015 - Jun 2018",
      description: [
        "Company creation and development of innovative concept into marketable solution",
        "Responsible for financing - venture capital research",
        "Led business development and associated sales",
        "Developed and integrated all internal management processes and related technological tools",
        "Responsible for recruitment - from job description to performance management",
        "Technology solution connecting on-demand concierges to business travelers through CRM enabling hotels to improve concierge productivity",
      ],
    },
  ],
  fr: [
    {
      title: "Gestionnaire de Projets / Conseillère en Entrepreneuriat",
      company: "CHAFRIC (Chantier d'Afrique du Canada)",
      location: "Montréal, Canada",
      period: "Fév 2024 - Présent | Déc 2021 - Juin 2022",
      current: true,
      description: [
        "Conseil et accompagnement des entrepreneurs dans l'élaboration du modèle d'affaires",
        "Planification du démarrage et la gestion de l'entreprise",
        "Aide à la recherche de financement et montage de dossier de financement",
        "Aide à l'organisation des activités de promotion, de visibilité et de réseautage",
        "Veille stratégique des nouvelles tendances relatives à l'entrepreneuriat et aux nouvelles technologies",
        "Rédaction périodique des rapports d'activités et de projets",
      ],
    },
    {
      title: "Consultante Business & Tech",
      company: "Tech Innovation Consulting",
      location: "Canada/Afrique",
      period: "Mars 2019 - Présent",
      current: true,
      description: [
        "Capturer les besoins des projets afin de les traduire en solutions commerciales et numériques dans un large éventail de secteurs",
        "Aider à la conception et au développement de stratégies clients autour de solutions numériques",
        "Mise en place des phases de prototypage, de test et d'intégration des différentes solutions pour l'ensemble des parties prenantes",
        "Assurer la gestion des principaux intervenants et acteurs majeurs des projets",
        "Comprendre et traduire les besoins des clients en solutions commerciales et technologiques",
        "Conception et accompagnement de projets intégrant IA générative (ChatGPT, DALL-E, automatisation n8n)",
        "Développement de MVP avec des outils no-code IA pour entrepreneurs (Afrique & Canada)",
      ],
    },
    {
      title: "Fondatrice",
      company: "Les Mounas",
      location: "Montréal, Canada",
      period: "Juin 2022 - Présent",
      current: true,
      description: [
        "Création et gestion complète de l'entreprise : conception de produits, marketing, e-commerce et financement",
        "Élaboration de stratégies pour le développement de la marque et sa présence numérique",
        "Développement de partenariats stratégiques en Chine et en Afrique pour élargir l'approvisionnement et la production",
        "Expansion du marché B2B en ciblant des collaborations avec des boutiques, librairies et distributeurs",
        "Développement d'un vendeur virtuel intelligent (avatar IA + voix clonée)",
      ],
    },
    {
      title: "Animateur et Mentor (Fr & Eng)",
      company: "African Management Institute (AMI)",
      location: "Plusieurs Pays Africains",
      period: "Nov 2020 - Présent",
      current: true,
      description: [
        "Préparation de l'atelier",
        "Animation des ateliers",
        "Conseils aux Entrepreneurs",
        "Fournir des outils pratiques et formation pour les entreprises ambitieuses à travers l'Afrique",
      ],
    },
    {
      title: "Gestionnaire de Projets d'Incubation",
      company: "ESP (Entrepreneurial Solutions Partners)",
      location: "Côte d'Ivoire / Rwanda",
      period: "Août 2019 - Avril 2020",
      description: [
        "Élaboration de la stratégie, du plan d'actions et du planning en partenariat avec les différentes équipes et partenaires",
        "Suivi du respect des accords avec les différents partenaires et sponsors",
        "Suivi et évaluation des besoins et progrès des entrepreneurs incubés",
        "Définition et établissement des processus d'affaires à l'interne",
        "Implémentation des outils technologiques pour la mobilisation, le recrutement, l'analyse et la sélection des projets",
        "Évaluation des résultats du programme et présentation aux différents partenaires",
        "Gestion d'Orange Corner - Abidjan (Côte d'Ivoire) et Tourism Inc. - Kigali (Rwanda)",
      ],
    },
    {
      title: "Directrice des Opérations - Programme d'Incubation en IA",
      company: "Creative Destruction Lab @ HEC Montreal",
      location: "Toronto & Montréal, Canada",
      period: "Avr 2018 - Mars 2019",
      description: [
        "Responsable de la mise en œuvre du CDL et gestion de l'ensemble des opérations du programme à HEC Montréal",
        "Développement du système de gestion de projet, implémentation de la pile technologique interne et documentation de tous les nouveaux processus CDL",
        "Mise en place de la stratégie de recrutement des startups en Intelligence artificielle, à l'international",
        "Développement et intégration des outils de recrutement, d'analyse des projets et de gestion du programme",
        "Application des outils analytiques et des cadres d'évaluation pour évaluer la pertinence des start-ups",
        "Gestion et formation des équipes",
        "Gestion du processus d'examen, d'entrevue et de sélection finale de chaque cohorte",
        "Responsable du reporting, du conseil et du succès du programme",
        "Recrutement et accompagnement de startups en intelligence artificielle appliquée (santé, finance, marketing)",
        "Collaboration avec des chercheurs, mentors et investisseurs spécialisés en deeptech et IA",
        "Définition et gestion des KPIs liés aux projets IA",
      ],
    },
    {
      title: "Community Lead & Expansion Manager",
      company: "Lighthouse Labs",
      location: "Montréal, Canada",
      period: "Août 2017 - Avril 2018",
      description: [
        "En charge du développement et l'expansion du programme à Montréal",
        "Responsable de tous les principaux indicateurs de performance clés",
        "Gestion et exécution de la stratégie d'exploitation du programme",
        "Surveillance mensuelle des dépenses liées au programme",
        "Préparation des rapports KPI sur une base mensuelle et trimestrielle",
        "Développement des partenariats et des initiatives de croissance conformes à la marque et à la mission du programme",
        "Développement et maintien de la culture d'entreprise",
      ],
    },
    {
      title: "Co-fondatrice & CEO",
      company: "Ask PAM",
      location: "Montréal, Canada",
      period: "Mars 2015 - Juin 2018",
      description: [
        "Création de l'entreprise et développement d'un concept innovant en solution commercialisable",
        "En charge du financement - Recherche de capital de risque",
        "En charge du développement des affaires et ventes associées",
        "Développement et intégration de l'ensemble des processus de gestion interne et outils technologiques liés",
        "En charge du recrutement - De la description du poste à la gestion de la performance",
        "Solution technologique mettant en relation des concierges à la demande aux voyageurs d'affaires grâce à un CRM permettant aux hôtels d'améliorer la productivité de leurs concierges",
      ],
    },
  ],
}

export const education: { en: Education[]; fr: Education[] } = {
  en: [
    {
      degree: "Digital Brand Strategy Certification",
      institution: "Institut de leadership en gestion",
      year: "2025",
    },
    {
      degree: "Business Analysis Certificate",
      institution: "Project Management Institute",
      year: "2021 (In Progress)",
    },
    {
      degree: "Business Strategy Certificate",
      institution: "Institut de leadership en gestion",
      year: "2020",
    },
    {
      degree: "Executive Leadership Program",
      institution: "THNK School of Creative Leadership (Netherlands)",
      year: "2019",
    },
    {
      degree: "Emerging Director Certificate (Governance)",
      institution: "Collège des administrateurs de sociétés - Université Laval",
      year: "2019",
    },
    {
      degree: "DUT Techniques de commercialisation",
      institution: "IUT/Institut Universitaire de Technologies d'Evry",
      year: "2005",
    },
    {
      degree: "Baccalauréat en Économie",
      institution: "Lycée Robert Doisneau",
      year: "2003",
    },
  ],
  fr: [
    {
      degree: "Certification en Stratégie de marque numérique",
      institution: "Institut de leadership en gestion",
      year: "2025",
    },
    {
      degree: "Certificat en Analyse d'Affaires",
      institution: "Project Management Institute",
      year: "2021 (En cours)",
    },
    {
      degree: "Certificat en Stratégie d'Entreprise",
      institution: "Institut de leadership en gestion",
      year: "2020",
    },
    {
      degree: "Executive Leadership Program",
      institution: "THNK School of Creative Leadership (Pays-Bas)",
      year: "2019",
    },
    {
      degree: "Certificat Administrateur de la relève (Gouvernance)",
      institution: "Collège des administrateurs de sociétés - Université Laval",
      year: "2019",
    },
    {
      degree: "DUT Techniques de commercialisation",
      institution: "IUT/Institut Universitaire de Technologies d'Evry",
      year: "2005",
    },
    {
      degree: "Baccalauréat en Économie",
      institution: "Lycée Robert Doisneau",
      year: "2003",
    },
  ],
}

export const projects: { en: Project[]; fr: Project[] } = {
  en: [
    {
      title: "AI Virtual Assistant for Pop-Up Stands",
      description:
        "Developed an intelligent virtual seller using ChatGPT, DALL-E, and voice cloning technology to enhance customer engagement at retail pop-up locations.",
      image: "/ai-virtual-assistant-chatbot-interface.jpg",
      tags: ["ChatGPT", "DALL-E", "Voice AI", "Retail Tech"],
    },
    {
      title: "Smart Appointment Management System",
      description:
        "Created an intelligent booking tool for small businesses integrating WhatsApp, n8n automation, and Airtable database for seamless customer scheduling.",
      image: "/appointment-scheduling-dashboard-interface.jpg",
      tags: ["WhatsApp API", "n8n", "Airtable", "Automation"],
    },
    {
      title: "Automated CRM for Incubator",
      description:
        "Built a comprehensive Airtable CRM system for CHAFRIC incubator with automated tracking, cohort analysis, and reporting capabilities.",
      image: "/crm-dashboard-with-analytics-charts.jpg",
      tags: ["Airtable", "CRM", "Analytics", "Automation"],
    },
    {
      title: "MiniMouna Educational Platform",
      description:
        "Developed an interactive educational platform with AI-generated content for children, featuring cultural learning experiences powered by generative AI.",
      image: "/educational-platform-for-children-colorful-interfa.jpg",
      tags: ["Generative AI", "EdTech", "No-Code", "Content Creation"],
    },
  ],
  fr: [
    {
      title: "Assistant Virtuel IA pour Stands Pop-Up",
      description:
        "Développement d'un vendeur virtuel intelligent utilisant ChatGPT, DALL-E et clonage vocal pour améliorer l'engagement client dans les points de vente éphémères.",
      image: "/ai-virtual-assistant-chatbot-interface.jpg",
      tags: ["ChatGPT", "DALL-E", "IA Vocale", "Retail Tech"],
    },
    {
      title: "Système de Gestion de Rendez-vous Intelligent",
      description:
        "Création d'un outil de réservation intelligent pour TPE intégrant WhatsApp, automatisation n8n et base de données Airtable pour une planification fluide.",
      image: "/appointment-scheduling-dashboard-interface.jpg",
      tags: ["WhatsApp API", "n8n", "Airtable", "Automatisation"],
    },
    {
      title: "CRM Automatisé pour Incubateur",
      description:
        "Construction d'un système CRM Airtable complet pour l'incubateur CHAFRIC avec suivi automatisé, analyse de cohortes et rapports.",
      image: "/crm-dashboard-with-analytics-charts.jpg",
      tags: ["Airtable", "CRM", "Analytique", "Automatisation"],
    },
    {
      title: "Plateforme Éducative MiniMouna",
      description:
        "Développement d'une plateforme éducative interactive avec contenus générés par IA pour enfants, proposant des expériences d'apprentissage culturel.",
      image: "/educational-platform-for-children-colorful-interfa.jpg",
      tags: ["IA Générative", "EdTech", "No-Code", "Création de Contenu"],
    },
  ],
}

export const skills: Skill[] = [
  // Technical Skills
  { name: "Generative AI (GPT, DALL-E)", level: 9, category: "technical" },
  { name: "Automation (n8n, Zapier, Make)", level: 9, category: "technical" },
  { name: "No-Code/Low-Code Tools", level: 9, category: "technical" },
  { name: "CRM Integration", level: 8, category: "technical" },
  { name: "Conversational AI", level: 8, category: "technical" },
  { name: "UX/UI Prototyping", level: 7, category: "technical" },
  { name: "Machine Learning & NLP", level: 7, category: "technical" },

  // Business Skills
  { name: "Strategic Innovation", level: 10, category: "business" },
  { name: "Digital Transformation", level: 10, category: "business" },
  { name: "Entrepreneurship Coaching", level: 9, category: "business" },
  { name: "Project Management", level: 9, category: "business" },
  { name: "Business Strategy", level: 9, category: "business" },
  { name: "Change Management", level: 8, category: "business" },
  { name: "Stakeholder Management", level: 8, category: "business" },

  // Languages
  { name: "French", level: 10, category: "language" },
  { name: "English", level: 10, category: "language" },
]

export const testimonials: { en: Testimonial[]; fr: Testimonial[] } = {
  en: [
    {
      name: "Jean-Marc Dubois",
      role: "CEO",
      company: "TechStart Africa",
      quote:
        "Pamela's expertise in AI integration transformed our business operations. Her strategic approach and hands-on support were invaluable in our digital transformation journey.",
      avatar: "/professional-businessman-portrait.png",
    },
    {
      name: "Sarah Johnson",
      role: "Director of Innovation",
      company: "Global Nonprofit Alliance",
      quote:
        "Working with Pamela was a game-changer. She helped us implement automation solutions that saved countless hours and improved our service delivery to communities.",
      avatar: "/professional-business-woman-portrait.png",
    },
    {
      name: "Ahmed Hassan",
      role: "Founder",
      company: "StartupHub Casablanca",
      quote:
        "Pamela's coaching and technical guidance were instrumental in launching our incubator program. Her international experience and AI knowledge are exceptional.",
      avatar: "/professional-entrepreneur-portrait.png",
    },
  ],
  fr: [
    {
      name: "Jean-Marc Dubois",
      role: "PDG",
      company: "TechStart Africa",
      quote:
        "L'expertise de Pamela en intégration d'IA a transformé nos opérations. Son approche stratégique et son soutien pratique ont été inestimables dans notre transformation numérique.",
      avatar: "/professional-businessman-portrait.png",
    },
    {
      name: "Sarah Johnson",
      role: "Directrice de l'Innovation",
      company: "Global Nonprofit Alliance",
      quote:
        "Travailler avec Pamela a tout changé. Elle nous a aidés à implémenter des solutions d'automatisation qui ont économisé d'innombrables heures et amélioré nos services.",
      avatar: "/professional-business-woman-portrait.png",
    },
    {
      name: "Ahmed Hassan",
      role: "Fondateur",
      company: "StartupHub Casablanca",
      quote:
        "Le coaching et les conseils techniques de Pamela ont été déterminants pour lancer notre programme d'incubation. Son expérience internationale et ses connaissances en IA sont exceptionnelles.",
      avatar: "/professional-entrepreneur-portrait.png",
    },
  ],
}

export const certifications = [
  {
    name: "n8n Automation Expert",
    issuer: "n8n Academy",
    year: "En cours / In Progress",
  },
  {
    name: "Prompt Engineering pour l'entreprise",
    issuer: "Coursera / DeepLearning.AI",
    year: "En cours / In Progress",
  },
  {
    name: "IBM Generative AI for Business",
    issuer: "Coursera",
    year: "En cours / In Progress",
  },
]
