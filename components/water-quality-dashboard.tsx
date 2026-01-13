"use client"

import { useState, useEffect, useCallback, Suspense, forwardRef, useImperativeHandle } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { fetchWaterQualityData, fetchPredictionData } from "@/lib/data-service"
import type { WaterQualityData, PredictionData } from "@/lib/types"
import type { WaterParameters } from "@/lib/wqi-calculator"
import { Activity, BarChart3, Globe, RefreshCw } from "lucide-react"
import LoadingSpinner from "./loading-spinner"

// Simple loading component
const ComponentLoader = ({ height = "300px", text = "Loading..." }) => (
  <div className={`h-[${height}] bg-slate-800/50 rounded-md flex items-center justify-center`}>
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500 mr-3"></div>
    <span>{text}</span>
  </div>
)

// Error fallback component
const ErrorFallback = ({ componentName, height = "300px" }) => (
  <div className={`h-[${height}] bg-slate-800/50 rounded-md flex flex-col items-center justify-center p-4`}>
    <div className="text-red-500 mb-2">Failed to load {componentName}</div>
    <p className="text-slate-400 text-center max-w-md">
      There was an error loading this component. Please try refreshing the page.
    </p>
    <Button onClick={() => window.location.reload()} className="mt-4">
      Refresh Page
    </Button>
  </div>
)

// Dynamically import client components with error boundaries and fallbacks
const WaterQualityChart = dynamic(
  () => import("./water-quality-chart").catch(() => () => <ErrorFallback componentName="chart" />),
  {
    ssr: false,
    loading: () => <ComponentLoader text="Loading chart..." />,
  },
)

const WaterQualityMap = dynamic(
  () => import("./water-quality-map").catch(() => () => <ErrorFallback componentName="map" height="500px" />),
  {
    ssr: false,
    loading: () => <ComponentLoader height="500px" text="Loading map..." />,
  },
)

const WaterQualityPrediction = dynamic(
  () =>
    import("./water-quality-prediction").catch(() => () => <ErrorFallback componentName="prediction" height="500px" />),
  {
    ssr: false,
    loading: () => <ComponentLoader height="500px" text="Loading prediction..." />,
  },
)

const WaterQualityStats = dynamic(
  () => import("./water-quality-stats").catch(() => () => <ErrorFallback componentName="stats" />),
  {
    ssr: false,
    loading: () => <ComponentLoader text="Loading stats..." />,
  },
)

const StatePredictionForm = dynamic(
  () =>
    import("./state-prediction-form").catch(() => () => (
      <ErrorFallback componentName="state prediction" height="500px" />
    )),
  {
    ssr: false,
    loading: () => <ComponentLoader height="500px" text="Loading prediction form..." />,
  },
)

// Load these components only when needed (lazy loading)
const AnomalyDetection = dynamic(
  () =>
    import("./anomaly-detection").catch(() => () => <ErrorFallback componentName="anomaly detection" height="500px" />),
  {
    ssr: false,
    loading: () => <ComponentLoader height="500px" text="Loading anomaly detection..." />,
  },
)

const AdvancedForecasting = dynamic(
  () =>
    import("./advanced-forecasting").catch(() => () => <ErrorFallback componentName="forecasting" height="500px" />),
  {
    ssr: false,
    loading: () => <ComponentLoader height="500px" text="Loading forecasting..." />,
  },
)

// Load InteractiveMap with no SSR and error handling
const InteractiveMap = dynamic(
  () => import("./interactive-map").catch(() => () => <ErrorFallback componentName="interactive map" height="600px" />),
  {
    ssr: false,
    loading: () => <ComponentLoader height="600px" text="Loading interactive map..." />,
  },
)

// Add this with the other dynamic imports
const TableauDashboard = dynamic(
  () => import("./tableau-dashboard").catch(() => import("./tableau-fallback").then((mod) => mod.default)),
  {
    ssr: false,
    loading: () => <ComponentLoader height="800px" text="Loading Tableau dashboard..." />,
  },
)

// Import FileUpload component
const FileUpload = dynamic(() => import("./file-upload"), {
  ssr: false,
  loading: () => <ComponentLoader height="500px" text="Loading file upload..." />,
})

// Import DashboardSettings component
const DashboardSettings = dynamic(() => import("./dashboard-settings"), {
  ssr: false,
  loading: () => <ComponentLoader height="500px" text="Loading settings..." />,
})

interface Settings {
  theme: "light" | "dark" | "system"
  showConfidenceIntervals: boolean
  mapStyle: "basic" | "detailed"
  refreshInterval: number
  defaultTab: string
  chartColors: "default" | "colorblind" | "monochrome"
}

interface WaterQualityDashboardProps {
  initialWaterQualityData?: WaterQualityData | null
  initialPredictionData?: PredictionData | null
  activeTab?: string
}

const WaterQualityDashboard = forwardRef<any, WaterQualityDashboardProps>(
  (
    { initialWaterQualityData = null, initialPredictionData = null, activeTab: externalActiveTab = "overview" },
    ref,
  ) => {
    const [waterQualityData, setWaterQualityData] = useState<WaterQualityData | null>(initialWaterQualityData)
    const [predictionData, setPredictionData] = useState<PredictionData | null>(initialPredictionData)
    const [loading, setLoading] = useState(!initialWaterQualityData || !initialPredictionData)
    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState(externalActiveTab)
    const [settings, setSettings] = useState<Settings>({
      theme: "dark",
      showConfidenceIntervals: true,
      mapStyle: "detailed",
      refreshInterval: 0,
      defaultTab: "overview",
      chartColors: "default",
    })
    const [userParameters, setUserParameters] = useState<Record<string, WaterParameters>>({})

    // Expose setActiveTab method to parent component
    useImperativeHandle(ref, () => ({
      setActiveTab: (tab: string) => {
        setActiveTab(tab)
      },
    }))

    // Update internal activeTab when externalActiveTab changes
    useEffect(() => {
      setActiveTab(externalActiveTab)
    }, [externalActiveTab])

    // Use useCallback to prevent recreation of this function on every render
    const loadData = useCallback(async () => {
      try {
        setLoading(true)
        const qualityData = await fetchWaterQualityData()
        const predictions = await fetchPredictionData()

        setWaterQualityData(qualityData)
        setPredictionData(predictions)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }, [])

    useEffect(() => {
      setMounted(true)

      // Load settings from localStorage only once on mount
      const savedSettings = localStorage.getItem("dashboardSettings")
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings)
          setSettings(parsedSettings)
        } catch (err) {
          console.error("Failed to parse saved settings", err)
        }
      }

      if (!initialWaterQualityData || !initialPredictionData) {
        loadData()
      }
    }, [loadData, initialWaterQualityData, initialPredictionData])

    // Separate useEffect for refresh interval to avoid unnecessary re-renders
    useEffect(() => {
      let refreshTimer: NodeJS.Timeout | null = null

      if (settings.refreshInterval > 0) {
        refreshTimer = setInterval(
          () => {
            loadData()
          },
          settings.refreshInterval * 60 * 1000,
        )
      }

      return () => {
        if (refreshTimer) {
          clearInterval(refreshTimer)
        }
      }
    }, [settings.refreshInterval, loadData])

    // Memoize the settings change handler to prevent recreation on every render
    const handleSettingsChange = useCallback((newSettings: Settings) => {
      setSettings(newSettings)

      // Apply theme change
      if (typeof document !== "undefined") {
        const htmlElement = document.documentElement
        if (newSettings.theme === "dark") {
          htmlElement.classList.add("dark")
        } else if (newSettings.theme === "light") {
          htmlElement.classList.remove("dark")
        }
      }
    }, [])

    const handleUserDataProcessed = useCallback(
      (data: { stations: any[]; parameters: Record<string, WaterParameters> }) => {
        if (!waterQualityData) return

        // Merge user data with existing data
        setWaterQualityData((prev) => {
          if (!prev) return null
          return {
            ...prev,
            geoData: [...data.stations],
          }
        })

        setUserParameters(data.parameters)

        // Switch to map tab to show the uploaded data
        setActiveTab("map")
      },
      [waterQualityData],
    )

    // Handle refresh button click
    const handleRefresh = () => {
      loadData()
    }

    if (!mounted) {
      return <LoadingSpinner />
    }

    if (loading) {
      return <LoadingSpinner />
    }

    // Render specific tab content with error handling
    const renderTabContent = (tabId: string) => {
      // Wrap each tab content in error boundaries
      try {
        switch (tabId) {
          case "overview":
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="glass-card border-slate-700/50">
                  <CardHeader className="p-4">
                    <CardTitle>Water Quality Index</CardTitle>
                    <CardDescription>Overall water quality trends over time</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {waterQualityData && (
                      <Suspense fallback={<ComponentLoader text="Loading chart..." />}>
                        <WaterQualityChart data={waterQualityData.yearlyWqi} type="line" title="Yearly WQI" />
                      </Suspense>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card border-slate-700/50">
                  <CardHeader className="p-4">
                    <CardTitle>Key Statistics</CardTitle>
                    <CardDescription>Summary of water quality parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {waterQualityData && (
                      <Suspense fallback={<ComponentLoader text="Loading stats..." />}>
                        <WaterQualityStats data={waterQualityData.stats} userParameters={userParameters} />
                      </Suspense>
                    )}
                  </CardContent>
                </Card>
              </div>
            )

          case "trends":
            return (
              <Card className="glass-card border-slate-700/50">
                <CardHeader className="p-4">
                  <CardTitle>Historical Water Quality Parameters</CardTitle>
                  <CardDescription>Trends in key water quality indicators</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {waterQualityData && (
                    <Suspense fallback={<ComponentLoader text="Loading chart..." />}>
                      <WaterQualityChart
                        data={waterQualityData.parameters}
                        type="multiLine"
                        title="Water Quality Parameters"
                      />
                    </Suspense>
                  )}
                </CardContent>
              </Card>
            )

          default:
            return null
        }
      } catch (error) {
        console.error(`Error rendering tab ${tabId}:`, error)
        return <ErrorFallback componentName={tabId} height="400px" />
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-sky-400">System Overview</h2>
            <p className="text-slate-400">Water quality metrics and predictions</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-1 rounded-full flex items-center">
              <span className="w-2 h-2 bg-sky-400 rounded-full mr-1 pulse"></span>
              LIVE
            </span>
            <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-slate-700/50">
            <CardHeader className="p-4">
              <CardTitle className="text-lg flex items-center">
                <Activity className="h-5 w-5 mr-2 text-sky-400" />
                Current WQI
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-end">
                <div className="text-4xl font-bold text-sky-400">{waterQualityData?.stats.currentWqi.toFixed(1)}</div>
                <div className="ml-2 text-sm text-slate-400">/ 100</div>
              </div>
              <div className="mt-2 text-sm text-slate-400">Overall water quality index across monitored stations</div>
              <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: `${waterQualityData?.stats.currentWqi}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-slate-700/50">
            <CardHeader className="p-4">
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
                Prediction Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-end">
                <div className="text-4xl font-bold text-purple-400">
                  {predictionData?.predictionValues[4].toFixed(1)}
                </div>
                <div className="ml-2 text-sm text-slate-400">in 5 years</div>
              </div>
              <div className="mt-2 text-sm text-slate-400">Projected WQI based on ARIMA model analysis</div>
              <div className="mt-4 flex items-center space-x-1">
                {predictionData?.predictionValues.slice(0, 5).map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-purple-500/30 rounded-sm"
                      style={{ height: `${Math.max(20, val / 2)}px` }}
                    ></div>
                    <div className="text-xs mt-1 text-slate-500">{predictionData.predictionYears[i].slice(2)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-slate-700/50">
            <CardHeader className="p-4">
              <CardTitle className="text-lg flex items-center">
                <Globe className="h-5 w-5 mr-2 text-emerald-400" />
                Monitoring Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-end">
                <div className="text-4xl font-bold text-emerald-400">{waterQualityData?.geoData.length}</div>
                <div className="ml-2 text-sm text-slate-400">stations</div>
              </div>
              <div className="mt-2 text-sm text-slate-400">
                Active monitoring stations across {new Set(waterQualityData?.geoData.map((d) => d.state)).size} states
              </div>
              <div className="mt-4 grid grid-cols-8 gap-1">
                {waterQualityData?.geoData.slice(0, 16).map((station, i) => (
                  <div
                    key={i}
                    className="w-full aspect-square rounded-sm"
                    style={{ backgroundColor: getWqiColor(station.wqi) }}
                    title={station.station}
                  ></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          {/* Responsive TabsList with scrolling on mobile */}
          <div className="relative w-full overflow-auto mb-4">
            <TabsList className="flex w-max min-w-full flex-nowrap overflow-x-auto py-1 px-0.5 scrollbar-thin bg-slate-800/50 rounded-md">
              <TabsTrigger
                value="overview"
                className="whitespace-nowrap data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="trends"
                className="whitespace-nowrap data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
              >
                Historical Trends
              </TabsTrigger>
              <TabsTrigger
                value="predictions"
                className="whitespace-nowrap data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
              >
                Predictions
              </TabsTrigger>
              <TabsTrigger
                value="map"
                className="whitespace-nowrap data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
              >
                Geographic Data
              </TabsTrigger>
              <TabsTrigger
                value="state-prediction"
                className="whitespace-nowrap data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
              >
                State Prediction
              </TabsTrigger>
              <TabsTrigger
                value="anomalies"
                className="whitespace-nowrap data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
              >
                Anomaly Detection
              </TabsTrigger>
              <TabsTrigger
                value="advanced-forecast"
                className="whitespace-nowrap data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
              >
                Advanced Forecast
              </TabsTrigger>
              <TabsTrigger
                value="interactive-map"
                className="whitespace-nowrap data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
              >
                Interactive Map
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="whitespace-nowrap data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
              >
                Upload Data
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="whitespace-nowrap data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
              >
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="tableau-dashboard"
                className="whitespace-nowrap data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
              >
                Tableau Dashboard
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Use suppressHydrationWarning on all TabsContent components */}
          <TabsContent value="overview" className="mt-4">
            {renderTabContent("overview")}
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            {renderTabContent("trends")}
          </TabsContent>

          <TabsContent value="predictions" className="mt-4">
            <Card className="glass-card border-slate-700/50">
              <CardHeader className="p-4">
                <CardTitle>15-Year Water Quality Predictions</CardTitle>
                <CardDescription>ARIMA model forecasts for future water quality</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 h-[500px]">
                {predictionData && (
                  <WaterQualityPrediction
                    data={predictionData}
                    showConfidenceIntervals={settings.showConfidenceIntervals}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <Card className="glass-card border-slate-700/50">
              <CardHeader className="p-4">
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Water quality by location</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {waterQualityData && <WaterQualityMap data={waterQualityData.geoData} mapStyle={settings.mapStyle} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="state-prediction" className="mt-4">
            <StatePredictionForm />
          </TabsContent>

          <TabsContent value="anomalies" className="mt-4">
            {waterQualityData && <AnomalyDetection data={waterQualityData} />}
          </TabsContent>

          <TabsContent value="advanced-forecast" className="mt-4">
            {predictionData && <AdvancedForecasting data={predictionData} />}
          </TabsContent>

          <TabsContent value="interactive-map" className="mt-4">
            {waterQualityData && <InteractiveMap data={waterQualityData.geoData} />}
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <FileUpload onDataProcessed={handleUserDataProcessed} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <DashboardSettings onSettingsChange={handleSettingsChange} />
          </TabsContent>

          <TabsContent value="tableau-dashboard" className="mt-4">
            <TableauDashboard />
          </TabsContent>
        </Tabs>
      </div>
    )
  },
)

WaterQualityDashboard.displayName = "WaterQualityDashboard"

// Helper function to get color based on WQI
function getWqiColor(wqi: number): string {
  if (wqi >= 95) return "#10b981" // emerald-500
  if (wqi >= 80) return "#34d399" // emerald-400
  if (wqi >= 65) return "#fbbf24" // amber-400
  if (wqi >= 45) return "#f97316" // orange-500
  return "#ef4444" // red-500
}

export default WaterQualityDashboard
