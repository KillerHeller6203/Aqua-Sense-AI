"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  // Ensure we only render theme changes on the client to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Use a simple wrapper during server-side rendering
  // This prevents hydration mismatches by not rendering any theme-specific content
  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
