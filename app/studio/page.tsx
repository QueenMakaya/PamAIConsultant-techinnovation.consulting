import { Suspense } from "react"
import Studio from "./Studio"

export const metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
}

export const viewport = {
  themeColor: "#FAF8F4",
  viewportFit: "cover",
}

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <p className="text-lg text-[var(--ava-mist)]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
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
