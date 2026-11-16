import ConsultationLanding from "./ConsultationLanding"

export const metadata = {
  title: "Consultation gratuite d'une heure pour les PME de Lanaudière | Tech Innovation Consulting",
  description:
    "Une heure avec une consultante de Terrebonne pour faire le point sur votre présence en ligne. Gratuit, sans engagement. Forfait réseaux sociaux à 250 $ par mois.",
  keywords:
    "gestion réseaux sociaux Lanaudière, consultante marketing Terrebonne, PME Lanaudière, Facebook Instagram entreprise Joliette Repentigny Mascouche",
  alternates: { canonical: "https://techinnovation.consulting/lanaudiere" },
  openGraph: {
    title: "PME de Lanaudière : une heure de consultation gratuite",
    description: "On regarde votre présence en ligne ensemble et vous repartez avec 3 actions concrètes.",
    url: "https://techinnovation.consulting/lanaudiere",
    siteName: "Tech Innovation Consulting",
    locale: "fr_CA",
    type: "website",
  },
}

export default function LanaudierePage() {
  return <ConsultationLanding />
}
