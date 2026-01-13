"use client"

import { useState, useEffect } from "react"
import { CalendarIcon } from "lucide-react"

interface PageHeaderProps {
  title: string
  description: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  const [currentDate, setCurrentDate] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Only set the date on the client side to avoid hydration mismatch
    setCurrentDate(new Date().toLocaleDateString())
  }, [])

  if (!mounted) {
    return (
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        <div className="flex items-center pt-4">
          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
          <span className="text-xs text-muted-foreground">Loading date...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <div className="flex items-center pt-4">
        <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
        <span className="text-xs text-muted-foreground">
          {currentDate ? `Data last updated: ${currentDate}` : "Loading date..."}
        </span>
      </div>
    </div>
  )
}
