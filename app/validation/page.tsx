import { Suspense } from "react"
import Validation from "./Validation"

export const metadata = {
  title: "Validation du calendrier",
  robots: { index: false, follow: false },
}

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <p
        className="text-lg text-[#003219]/70"
        style={{ fontFamily: "var(--font-fraunces), serif" }}
      >
        Le calendrier se charge…
      </p>
    </div>
  )
}

export default function ValidationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Validation />
    </Suspense>
  )
}
