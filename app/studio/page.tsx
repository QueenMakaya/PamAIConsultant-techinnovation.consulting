import { Suspense } from "react"
import Studio from "./Studio"

export const metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
}

export const viewport = {
  themeColor: "#0B0F0D",
  viewportFit: "cover",
}

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <p className="text-lg text-[#F7F3EA]/60" style={{ fontFamily: "var(--font-fraunces), serif" }}>
        Le studio s'allume…
      </p>
    </div>
  )
}

export default function StudioPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Studio />
    </Suspense>
  )
}
