import SolarLanding from "./SolarLanding"

export const metadata = {
  title: "Solfutur | Le solaire, vérifié. Solar, verified.",
  description:
    "Estimez votre installation solaire et la subvention Hydro-Québec, puis recevez des soumissions d'installateurs licenciés RBQ. Gratuit et sans engagement.",
  keywords:
    "panneaux solaires Québec, subvention Hydro-Québec, LogisVert, installateur solaire RBQ, soumission panneaux solaires, solar panels Quebec",
  alternates: { canonical: "https://solfutur.ca" },
  openGraph: {
    title: "Solfutur | Le solaire, vérifié. Solar, verified.",
    url: "https://solfutur.ca",
    siteName: "Solfutur",
    locale: "fr_CA",
    description: "Estimation gratuite, subvention LogisVert, installateurs licenciés RBQ. Zéro porte-à-porte.",
    type: "website",
  },
}

export default function SolairePage() {
  return <SolarLanding />
}
