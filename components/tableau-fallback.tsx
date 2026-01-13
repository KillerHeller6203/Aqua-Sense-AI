"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, ExternalLink } from "lucide-react"

interface TableauFallbackProps {
  url?: string
  error?: string
  onRetry?: () => void
}

export default function TableauFallback({
  url = "https://public.tableau.com/views/WaterQualityAnalysis_17338513409590/Dashboard1",
  error = "Unable to load Tableau dashboard",
  onRetry,
}: TableauFallbackProps) {
  return (
    <Card className="glass-card border-slate-700/50">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Water Quality Analysis Dashboard</CardTitle>
            <CardDescription>Interactive Tableau visualization of water quality data</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="bg-slate-800/50 rounded-md p-8 flex flex-col items-center justify-center min-h-[600px]">
          <BarChart3 className="h-16 w-16 text-slate-500 mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">Dashboard Unavailable</h3>
          <p className="text-slate-400 text-center max-w-md mb-6">{error}</p>

          <div className="flex gap-4">
            {onRetry && <Button onClick={onRetry}>Try Again</Button>}
            <Button variant="outline" onClick={() => window.open(url, "_blank")} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open in Tableau Public
            </Button>
          </div>

          <div className="mt-8 p-4 bg-slate-700/30 rounded-md max-w-md">
            <h4 className="font-medium text-slate-300 mb-2">Alternative Data Views</h4>
            <p className="text-sm text-slate-400 mb-4">
              You can still explore the water quality data using the other dashboard features:
            </p>
            <ul className="text-sm text-slate-400 list-disc pl-5 space-y-1">
              <li>Interactive Map</li>
              <li>Water Quality Predictions</li>
              <li>Anomaly Detection</li>
              <li>State-wise Analysis</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
