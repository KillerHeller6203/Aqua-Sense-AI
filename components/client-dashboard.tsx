"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import LoadingSpinner from "@/components/loading-spinner"

// Dynamically import the actual dashboard with no SSR
const DashboardContent = dynamic(() => import("@/components/dashboard-content"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
})

export default function ClientDashboard() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show a simple loading state until client-side rendering is ready
  if (!mounted) {
    return (
      <div className="min-h-screen gradient-bg text-slate-200 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Only render the full dashboard content after client-side mounting
  return <DashboardContent />
}
