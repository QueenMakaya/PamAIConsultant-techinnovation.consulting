import type { StudioProfile, Theme } from "./types"

// Pam's own show. The host speaks to the guest with "tu" in French — it's Pam
// interviewing Pam. Questions stay open-ended so they pull stories, not facts.

const themes: Theme[] = [
  {
    id: "visibilite",
    title: { fr: "Épisode 0 — Se montrer", en: "Episode 0 — Showing up" },
    blurb: {
      fr: "Pourquoi cette chaîne, pourquoi maintenant, et ce que ça te coûte d'être visible.",
      en: "Why this channel, why now, and what it costs you to be visible.",
    },
    questions: [
      {
        id: "vis-1",
        text: {
          fr: "Tu as toujours préféré rester derrière l'écran. Qu'est-ce qui a changé pour que tu acceptes enfin de te montrer ?",
          en: "You've always preferred staying behind the screen. What changed that made you finally agree to show up?",
        },
      },
      {
        id: "vis-2",
        text: {
          fr: "Qu'est-ce qui te fait le plus peur dans le fait de parler de toi publiquement ?",
          en: "What scares you most about talking about yourself in public?",
        },
        depth: "deep",
      },
      {
        id: "vis-3",
        text: {
          fr: "Si tu devais te présenter à quelqu'un qui ne te connaît pas du tout, en une minute, tu dirais quoi ?",
          en: "If you had one minute to introduce yourself to someone who doesn't know you at all, what would you say?",
        },
      },
      {
        id: "vis-4",
        text: {
          fr: "Tu parles de « transparence totale ». Concrètement, qu'est-ce que tu es prête à montrer, et qu'est-ce qui reste à toi ?",
          en: "You talk about full transparency. Concretely, what are you willing to show, and what stays yours?",
        },
      },
      {
        id: "vis-5",
        text: {
          fr: "Qui est la personne que tu imagines en train de regarder cette vidéo ?",
          en: "Who is the person you picture watching this video?",
        },
      },
      {
        id: "vis-6",
        text: {
          fr: "Dans un an, qu'est-ce qui ferait que cette chaîne a valu le coup ?",
          en: "A year from now, what would make this channel worth it?",
        },
      },
    ],
  },
  {
    id: "parcours",
    title: { fr: "Mon parcours", en: "My journey" },
    blurb: {
      fr: "D'où tu viens, entre l'Afrique et le Canada, et les moments qui t'ont menée ici.",
      en: "Where you come from, between Africa and Canada, and the moments that led you here.",
    },
    questions: [
      {
        id: "par-1",
        text: {
          fr: "Raconte-moi la petite fille que tu étais. Qu'est-ce qu'elle voulait faire plus tard ?",
          en: "Tell me about the little girl you were. What did she want to be when she grew up?",
        },
      },
      {
        id: "par-2",
        text: {
          fr: "C'était quand, la première fois que tu t'es sentie entrepreneure, même sans le mot ?",
          en: "When was the first time you felt like an entrepreneur, even before you had the word for it?",
        },
      },
      {
        id: "par-3",
        text: {
          fr: "Tu vis entre deux mondes, l'Afrique et le Canada. Qu'est-ce que chacun t'a appris ?",
          en: "You live between two worlds, Africa and Canada. What has each one taught you?",
        },
      },
      {
        id: "par-4",
        text: {
          fr: "Quel a été le vrai tournant de ton parcours, celui après lequel rien n'a plus été pareil ?",
          en: "What was the real turning point in your journey, the one after which nothing was the same?",
        },
      },
      {
        id: "par-5",
        text: {
          fr: "Y a-t-il une personne sans qui tu ne serais pas là aujourd'hui ?",
          en: "Is there one person without whom you wouldn't be here today?",
        },
      },
      {
        id: "par-6",
        text: {
          fr: "Si tu pouvais parler à la Pam d'il y a dix ans, tu lui dirais quoi ?",
          en: "If you could talk to the Pam of ten years ago, what would you tell her?",
        },
      },
    ],
  },
  {
    id: "tech-innovation",
    title: { fr: "Tech Innovation Consulting & l'IA", en: "Tech Innovation Consulting & AI" },
    blurb: {
      fr: "Ton cabinet, ton expertise en IA et transformation numérique, et ce que tu vois sur le terrain.",
      en: "Your firm, your AI and digital transformation expertise, and what you see in the field.",
    },
    questions: [
      {
        id: "tic-1",
        text: {
          fr: "Tu as fondé Tech Innovation Consulting en 2019. C'était quoi le déclic ?",
          en: "You founded Tech Innovation Consulting in 2019. What was the trigger?",
        },
      },
      {
        id: "tic-2",
        text: {
          fr: "Comment tu expliquerais ce que tu fais à ta grand-mère ?",
          en: "How would you explain what you do to your grandmother?",
        },
      },
      {
        id: "tic-3",
        text: {
          fr: "Raconte-moi un projet client dont tu es vraiment fière. Le problème, ce que tu as construit, le résultat.",
          en: "Tell me about a client project you're really proud of. The problem, what you built, the result.",
        },
      },
      {
        id: "tic-4",
        text: {
          fr: "Qu'est-ce que la plupart des entrepreneurs comprennent mal à propos de l'IA ?",
          en: "What do most entrepreneurs get wrong about AI?",
        },
      },
      {
        id: "tic-5",
        text: {
          fr: "Tu construis des outils sans code pour des petites entreprises. Pourquoi c'est important pour toi que ce soit accessible ?",
          en: "You build no-code tools for small businesses. Why does it matter to you that this stays accessible?",
        },
      },
      {
        id: "tic-6",
        text: {
          fr: "Un projet qui ne s'est pas passé comme prévu, et ce que tu en as tiré ?",
          en: "A project that didn't go as planned, and what you took from it?",
        },
      },
      {
        id: "tic-7",
        text: {
          fr: "Si une entrepreneure t'appelle demain et te dit « je ne sais pas par où commencer avec l'IA », tu lui conseilles quoi ?",
          en: "If an entrepreneur calls you tomorrow and says 'I don't know where to start with AI', what do you tell them?",
        },
      },
    ],
  },
  {
    id: "accompagnement",
    title: { fr: "Accompagner les entrepreneurs", en: "Supporting entrepreneurs" },
    blurb: {
      fr: "CHAFRIC, l'incubation, le mentorat : ce que tu as appris en aidant les autres à lancer.",
      en: "CHAFRIC, incubation, mentoring: what you learned helping others launch.",
    },
    questions: [
      {
        id: "acc-1",
        text: {
          fr: "Tu accompagnes des entrepreneurs depuis des années, de CHAFRIC aux programmes d'incubation. Qu'est-ce qui te pousse à faire ça ?",
          en: "You've been supporting entrepreneurs for years, from CHAFRIC to incubation programs. What drives you to do it?",
        },
      },
      {
        id: "acc-2",
        text: {
          fr: "Quelle est l'erreur que tu vois revenir le plus souvent chez les gens qui se lancent ?",
          en: "What's the mistake you see most often in people who are starting out?",
        },
      },
      {
        id: "acc-3",
        text: {
          fr: "Raconte-moi un entrepreneur ou une entrepreneure qui t'a marquée. Qu'est-ce qui s'est passé ?",
          en: "Tell me about one entrepreneur who stayed with you. What happened?",
        },
      },
      {
        id: "acc-4",
        text: {
          fr: "Les entrepreneurs issus de la diaspora africaine font face à quoi, que les autres ne voient pas ?",
          en: "What do entrepreneurs from the African diaspora face that others don't see?",
        },
      },
      {
        id: "acc-5",
        text: {
          fr: "Le financement, c'est souvent le nerf de la guerre. Qu'est-ce que tu as appris en montant des dossiers ?",
          en: "Funding is often the crux. What have you learned from putting funding applications together?",
        },
      },
      {
        id: "acc-6",
        text: {
          fr: "Est-ce que conseiller les autres t'a rendue meilleure dans tes propres entreprises, ou plus exigeante avec toi-même ?",
          en: "Has advising others made you better at your own businesses, or harder on yourself?",
        },
      },
    ],
  },
  {
    id: "mounas",
    title: { fr: "Les Mounas", en: "Les Mounas" },
    blurb: {
      fr: "Ta marque d'éducation pour les tout-petits, ancrée dans la culture afro.",
      en: "Your early-learning brand for little ones, rooted in Afro culture.",
    },
    questions: [
      {
        id: "mou-1",
        text: {
          fr: "D'où est venue l'idée des Mounas ?",
          en: "Where did the idea for Les Mounas come from?",
        },
      },
      {
        id: "mou-2",
        text: {
          fr: "Pourquoi c'est important pour toi que des enfants de zéro à cinq ans se voient dans ce qu'ils apprennent ?",
          en: "Why does it matter to you that children from zero to five see themselves in what they learn?",
        },
      },
      {
        id: "mou-3",
        text: {
          fr: "Comment tu construis un contenu éducatif ? Montre-moi les coulisses, de l'idée à la publication.",
          en: "How do you build educational content? Walk me behind the scenes, from idea to publication.",
        },
      },
      {
        id: "mou-4",
        text: {
          fr: "Qu'est-ce qui a été le plus dur dans le lancement d'une marque pour enfants ?",
          en: "What's been the hardest part of launching a children's brand?",
        },
      },
      {
        id: "mou-5",
        text: {
          fr: "Tu utilises l'IA pour créer une partie du contenu. Où est la limite entre l'outil et ta touche à toi ?",
          en: "You use AI to create some of the content. Where's the line between the tool and your own touch?",
        },
      },
      {
        id: "mou-6",
        text: {
          fr: "Un retour d'un parent ou d'un enfant qui t'a touchée ?",
          en: "A message from a parent or a child that touched you?",
        },
      },
      {
        id: "mou-7",
        text: {
          fr: "Les Mounas dans cinq ans, ça ressemble à quoi ?",
          en: "What do Les Mounas look like five years from now?",
        },
      },
    ],
  },
  {
    id: "coulisses",
    title: { fr: "Les coulisses de la semaine", en: "Behind the scenes this week" },
    blurb: {
      fr: "Le format hebdo : ce qui s'est passé, les victoires, les galères, la suite.",
      en: "The weekly format: what happened, the wins, the struggles, what's next.",
    },
    questions: [
      {
        id: "cou-1",
        text: {
          fr: "Alors, cette semaine, tu as passé ton temps sur quoi ?",
          en: "So, what did you spend your week on?",
        },
      },
      {
        id: "cou-2",
        text: {
          fr: "Une victoire de la semaine, même petite ?",
          en: "One win from this week, even a small one?",
        },
      },
      {
        id: "cou-3",
        text: {
          fr: "Et ce qui a coincé ? Qu'est-ce qui ne s'est pas passé comme tu voulais ?",
          en: "And what got stuck? What didn't go the way you wanted?",
        },
      },
      {
        id: "cou-4",
        text: {
          fr: "Un outil, une méthode ou une rencontre qui t'a aidée cette semaine ?",
          en: "A tool, a method, or a person that helped you this week?",
        },
      },
      {
        id: "cou-5",
        text: {
          fr: "Côté chiffres, sans tabou : où en sont tes projets ?",
          en: "On the numbers, no taboos: where do your projects stand?",
        },
        depth: "deep",
      },
      {
        id: "cou-6",
        text: {
          fr: "La priorité numéro un pour la semaine prochaine ?",
          en: "Your number one priority for next week?",
        },
      },
    ],
  },
  {
    id: "vrai-entrepreneuriat",
    title: { fr: "L'entrepreneuriat, sans filtre", en: "Entrepreneurship, unfiltered" },
    blurb: {
      fr: "L'argent, le doute, les échecs, Ask PAM, et tout ce qu'on ne montre pas sur LinkedIn.",
      en: "Money, doubt, failure, Ask PAM, and everything nobody posts on LinkedIn.",
    },
    questions: [
      {
        id: "vra-1",
        text: {
          fr: "Tu as été cofondatrice et PDG d'Ask PAM. Raconte-moi cette aventure, sans enjoliver.",
          en: "You were co-founder and CEO of Ask PAM. Tell me that story, without polishing it.",
        },
      },
      {
        id: "vra-2",
        text: {
          fr: "C'était quand, la dernière fois que tu as eu envie de tout arrêter ?",
          en: "When was the last time you wanted to quit everything?",
        },
        depth: "deep",
      },
      {
        id: "vra-3",
        text: {
          fr: "Comment tu gères plusieurs entreprises en même temps sans t'éparpiller ? Ou est-ce que tu t'éparpilles ?",
          en: "How do you run several businesses at once without spreading yourself thin? Or do you?",
        },
      },
      {
        id: "vra-4",
        text: {
          fr: "Parlons argent. Quel est ton rapport à l'argent en tant qu'entrepreneure ?",
          en: "Let's talk money. What's your relationship with money as an entrepreneur?",
        },
        depth: "deep",
      },
      {
        id: "vra-5",
        text: {
          fr: "Un échec dont tu es reconnaissante aujourd'hui ?",
          en: "A failure you're grateful for today?",
        },
      },
      {
        id: "vra-6",
        text: {
          fr: "Qu'est-ce que tu as appris à refuser ?",
          en: "What have you learned to say no to?",
        },
      },
      {
        id: "vra-7",
        text: {
          fr: "Le syndrome de l'imposteur, il est encore là ?",
          en: "Is the impostor syndrome still there?",
        },
        depth: "deep",
      },
    ],
  },
  {
    id: "famille",
    title: { fr: "Famille & équilibre", en: "Family & balance" },
    blurb: {
      fr: "Les gens derrière toi, ce que l'entrepreneuriat demande à ta famille, et comment tu tiens.",
      en: "The people behind you, what entrepreneurship asks of your family, and how you hold it together.",
    },
    questions: [
      {
        id: "fam-1",
        text: {
          fr: "Qu'est-ce que ta famille pense de ce que tu fais ?",
          en: "What does your family think of what you do?",
        },
      },
      {
        id: "fam-2",
        text: {
          fr: "Qu'est-ce que l'entrepreneuriat a demandé à tes proches, que tu n'avais pas prévu ?",
          en: "What has entrepreneurship asked of the people close to you that you didn't expect?",
        },
        depth: "deep",
      },
      {
        id: "fam-3",
        text: {
          fr: "À quoi ressemble une journée type, du réveil au coucher, en vrai ?",
          en: "What does a typical day look like, from waking up to going to bed, for real?",
        },
      },
      {
        id: "fam-4",
        text: {
          fr: "Quelles valeurs de ta famille retrouve-t-on dans tes entreprises ?",
          en: "Which of your family's values show up in your businesses?",
        },
      },
      {
        id: "fam-5",
        text: {
          fr: "Comment tu te ressources quand tu n'en peux plus ?",
          en: "How do you recharge when you've got nothing left?",
        },
        depth: "deep",
      },
      {
        id: "fam-6",
        text: {
          fr: "Qu'est-ce que tu veux transmettre, au-delà des entreprises ?",
          en: "What do you want to pass on, beyond the businesses?",
        },
      },
    ],
  },
]

export const pamProfile: StudioProfile = {
  slug: "pam",
  showName: { fr: "Pam, en toute transparence", en: "Pam, Fully Transparent" },
  tagline: {
    fr: "Entrepreneuriat, IA et vraie vie — chaque semaine.",
    en: "Entrepreneurship, AI and real life — every week.",
  },
  guest: {
    name: "Pam",
    bio: {
      fr: "Pamela Alfred, consultante en IA et transformation numérique basée à Montréal. Fondatrice de Tech Innovation Consulting (2019) et des Mounas (éducation 0-5 ans ancrée dans la culture afro). Gestionnaire de projets et conseillère en entrepreneuriat chez CHAFRIC. Ancienne cofondatrice et PDG d'Ask PAM, directrice des opérations du programme d'incubation IA du Creative Destruction Lab à HEC Montréal, mentore à l'African Management Institute. Travaille entre le Canada et l'Afrique.",
      en: "Pamela Alfred, AI and digital transformation consultant based in Montreal. Founder of Tech Innovation Consulting (2019) and Les Mounas (early learning for ages 0-5, rooted in Afro culture). Project manager and entrepreneurship advisor at CHAFRIC. Former co-founder and CEO of Ask PAM, Director of Operations of the Creative Destruction Lab AI incubation program at HEC Montreal, mentor at the African Management Institute. Works between Canada and Africa.",
    },
  },
  host: {
    name: { fr: "AVA", en: "AVA" },
    avatar: {
      skin: "#8D5524",
      hair: "#1B1410",
      hairStyle: "puff",
      outfit: "#B5822B",
      accent: "#F2C14E",
      glasses: false,
      earrings: true,
    },
  },
  themes,
  closingQuestion: {
    fr: "Pour finir : si quelqu'un regarde ça et hésite encore à se lancer, tu lui dis quoi ?",
    en: "To wrap up: if someone watching this is still hesitating to start, what do you tell them?",
  },
}
