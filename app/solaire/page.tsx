import { Suspense } from "react"
import SolarLanding from "./SolarLanding"

export const metadata = {
  title: "Soleil Commun | Le solaire au Québec, expliqué entre voisins",
  description:
    "Estimez votre installation solaire et la subvention Hydro-Québec, puis recevez des soumissions d'installateurs licenciés RBQ. Gratuit et sans engagement.",
  openGraph: {
    title: "Soleil Commun | Le solaire au Québec, expliqué entre voisins",
    description: "Estimation gratuite, subvention LogisVert, installateurs licenciés RBQ. Zéro porte-à-porte.",
    type: "website",
  },
}

export default function SolairePage() {
  return (
    <Suspense>
      <SolarLanding />
    </Suspense>
  )
}
