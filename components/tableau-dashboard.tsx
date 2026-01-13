"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface TableauDashboardProps {
  url?: string
  height?: number
  width?: string
  hideTabs?: boolean
  hideToolbar?: boolean
}

export default function TableauDashboard({
  url = "https://public.tableau.com/views/WaterQualityAnalysis_17338513409590/Dashboard1",
  height = 800,
  width = "100%",
  hideTabs = false,
  hideToolbar = false,
}: TableauDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vizRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Load Tableau API and initialize the viz
  useEffect(() => {
    setMounted(true)

    // Clean up function
    return () => {
      if (vizRef.current) {
        try {
          vizRef.current.dispose()
          vizRef.current = null
        } catch (e) {
          console.error("Error disposing Tableau viz:", e)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Load Tableau JavaScript API
    const loadTableauAPI = async () => {
      try {
        // Check if Tableau API is already loaded
        if (window.tableau && window.tableau.Viz) {
          initializeViz()
          return
        }

        // Load Tableau API script
        const script = document.createElement("script")
        // Use the correct API URL for Tableau Public
        script.src = "https://public.tableau.com/javascripts/api/tableau-2.min.js"
        script.async = true
        script.onload = () => {
          // Add a small delay to ensure the API is fully initialized
          setTimeout(() => {
            if (window.tableau && window.tableau.Viz) {
              initializeViz()
            } else {
              setError("Tableau API loaded but Viz constructor not found")
              setLoading(false)
            }
          }, 500)
        }
        script.onerror = () => {
          setError("Failed to load Tableau API")
          setLoading(false)
        }
        document.body.appendChild(script)

        return () => {
          if (script.parentNode) {
            document.body.removeChild(script)
          }
        }
      } catch (err) {
        console.error("Error loading Tableau API:", err)
        setError("Failed to load Tableau API")
        setLoading(false)
      }
    }

    loadTableauAPI()
  }, [mounted, url, hideTabs, hideToolbar])

  // Initialize the Tableau visualization
  const initializeViz = () => {
    if (!containerRef.current || !window.tableau || !window.tableau.Viz) {
      setError("Tableau API not properly loaded")
      setLoading(false)
      return
    }

    try {
      // Dispose of existing viz if any
      if (vizRef.current) {
        try {
          vizRef.current.dispose()
        } catch (e) {
          console.error("Error disposing existing viz:", e)
        }
        vizRef.current = null
      }

      // Clean the container
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }

      // Make sure we're using a valid Tableau Public URL
      // Convert from the sharing URL to the embed URL format if needed
      let embedUrl = url

      // If it's a Tableau Public URL, ensure it's in the correct format
      if (url.includes("public.tableau.com")) {
        // If it's already in the /views/ format, use it directly
        if (!url.includes("/views/")) {
          // Extract the viz name from the URL
          const parts = url.split("/")
          let vizName = ""
          let dashboardName = ""

          // Try to extract viz name and dashboard name
          for (let i = 0; i < parts.length; i++) {
            if (parts[i] === "viz" && i + 1 < parts.length) {
              vizName = parts[i + 1]
              if (i + 2 < parts.length) {
                dashboardName = parts[i + 2].split("?")[0]
              }
              break
            }
          }

          if (vizName) {
            embedUrl = `https://public.tableau.com/views/${vizName}/${dashboardName || "Dashboard1"}`
          }
        }
      }

      console.log("Initializing Tableau viz with URL:", embedUrl)

      // Set up options for the viz
      const options = {
        hideTabs: hideTabs,
        hideToolbar: hideToolbar,
        width: width,
        height: height,
        onFirstInteractive: () => {
          console.log("Tableau viz is interactive")
          setLoading(false)
        },
      }

      // Create a new viz object
      if (window.tableau && window.tableau.Viz && containerRef.current) {
        vizRef.current = new window.tableau.Viz(containerRef.current, embedUrl, options)
      } else {
        throw new Error("Tableau API not properly loaded")
      }
    } catch (err) {
      console.error("Error initializing Tableau viz:", err)
      setError(`Failed to initialize Tableau dashboard: ${err.message || "Unknown error"}`)
      setLoading(false)
    }
  }

  // Handle refresh button click
  const handleRefresh = () => {
    if (vizRef.current) {
      try {
        vizRef.current.refreshDataAsync()
      } catch (err) {
        console.error("Error refreshing Tableau viz:", err)
      }
    }
  }

  // Handle manual reload
  const handleManualLoad = () => {
    setLoading(true)
    setError(null)

    // Add a small delay before trying to initialize again
    setTimeout(() => {
      if (window.tableau && window.tableau.Viz) {
        initializeViz()
      } else {
        // Try to reload the script
        const script = document.createElement("script")
        script.src = "https://public.tableau.com/javascripts/api/tableau-2.min.js"
        script.async = true
        script.onload = () => {
          setTimeout(initializeViz, 500)
        }
        script.onerror = () => {
          setError("Failed to load Tableau API")
          setLoading(false)
        }
        document.body.appendChild(script)
      }
    }, 1000)
  }

  if (!mounted) {
    return (
      <div className="h-[800px] bg-gray-100 rounded-md flex items-center justify-center">
        Loading Tableau dashboard...
      </div>
    )
  }

  return (
    <Card className="glass-card border-slate-700/50">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Water Quality Analysis Dashboard</CardTitle>
            <CardDescription>Interactive Tableau visualization of water quality data</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={handleManualLoad}>
              Reload
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md text-center">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={handleManualLoad}>Try Again</Button>
              <Button variant="outline" onClick={() => window.open(url, "_blank")}>
                Open in Tableau Public
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div
              ref={containerRef}
              className="w-full rounded-md overflow-hidden"
              style={{ minHeight: `${height}px` }}
            ></div>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mb-4"></div>
                  <p className="text-sky-400">Loading Tableau dashboard...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Add this to the global Window interface
declare global {
  interface Window {
    tableau: any
  }
}
