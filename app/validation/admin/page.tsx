import { Suspense } from "react"
import AdminDashboard from "./AdminDashboard"

export const metadata = {
  title: "Content Ops · tableau de bord",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminDashboard />
    </Suspense>
  )
}
