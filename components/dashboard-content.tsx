"use client"

import { useState, useEffect, useRef } from "react"
import {
  Droplet,
  LayoutDashboard,
  Activity,
  Database,
  Globe,
  Shield,
  Settings,
  BarChart3,
  RefreshCw,
  Upload,
  AlertTriangle,
  LineChart,
} from "lucide-react"
import { fetchWaterQualityData, fetchPredictionData } from "@/lib/data-service"
import dynamic from "next/dynamic"
import LoadingSpinner from "@/components/loading-spinner"

// Dynamically import the dashboard component with no SSR
const WaterQualityDashboard = dynamic(() => import("@/components/water-quality-dashboard"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
})

// Fixed water news alerts to avoid any randomness
const waterNewsAlerts = [
  {
    type: "critical",
    title: "Critical Alert",
    time: "2h ago",
    message: "High pollution levels detected in Yamuna at Delhi",
  },
  {
    type: "warning",
    title: "Warning",
    time: "6h ago",
    message: "Declining DO levels in Ganga at Haridwar",
  },
  {
    type: "info",
    title: "Info",
    time: "1d ago",
    message: "Model retraining completed successfully",
  },
]

export default function DashboardContent() {
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState<string>("00:00:00")
  const [currentDate, setCurrentDate] = useState<string>("Jan 1, 2023")
  const [waterQualityData, setWaterQualityData] = useState(null)
  const [predictionData, setPredictionData] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const dashboardRef = useRef<any>(null)

  useEffect(() => {
    // Update time every second with fixed formatting
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      )
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      )
    }

    updateTime() // Initial update
    const timer = setInterval(updateTime, 1000)

    // Load data
    const loadData = async () => {
      try {
        setLoading(true)
        const qualityData = await fetchWaterQualityData()
        const predictions = await fetchPredictionData()

        setWaterQualityData(qualityData)
        setPredictionData(predictions)
        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        setLoading(false)
      }
    }

    loadData()

    return () => {
      clearInterval(timer)
    }
  }, [])

  // Handle sidebar navigation
  const handleNavigation = (tab: string) => {
    if (dashboardRef.current && typeof dashboardRef.current.setActiveTab === "function") {
      dashboardRef.current.setActiveTab(tab)
    }
    setActiveTab(tab)
  }

  // Handle button clicks
  const handleButtonClick = (action: string) => {
    switch (action) {
      case "refresh":
        window.location.reload()
        break
      case "upload":
        handleNavigation("upload")
        break
      case "anomaly":
        handleNavigation("anomalies")
        break
      case "prediction-state":
        handleNavigation("state-prediction")
        break
      case "tableau-dashboard":
        handleNavigation("tableau-dashboard")
        break
      default:
        break
    }
  }

  return (
    <div className="min-h-screen gradient-bg text-slate-200">
      {/* Top Navigation - Simplified */}
      <header className="glass border-b border-sky-500/20 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Droplet className="h-8 w-8 text-sky-400" />
          <h1 className="text-3xl font-bold tracking-tight glow text-sky-400">AquaPulse</h1>
        </div>

        <div className="flex-1"></div>

        {/* Profile avatar only - removed notifications and theme toggle */}
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-sky-500 flex items-center justify-center">
            <span className="font-medium text-slate-900">AP</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar - Removed console and reports */}
        <aside className="sidebar w-full md:w-64 p-4 md:min-h-[calc(100vh-4rem)]">
          <nav className="space-y-1">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation("overview")
              }}
              className={`sidebar-item px-4 py-3 rounded flex items-center space-x-3 ${activeTab === "overview" ? "active" : ""}`}
            >
              <LayoutDashboard className={`h-5 w-5 ${activeTab === "overview" ? "text-sky-400" : "text-slate-400"}`} />
              <span>Dashboard</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation("trends")
              }}
              className={`sidebar-item px-4 py-3 rounded flex items-center space-x-3 ${activeTab === "trends" ? "active" : ""}`}
            >
              <Activity className={`h-5 w-5 ${activeTab === "trends" ? "text-sky-400" : "text-slate-400"}`} />
              <span>Analytics</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation("upload")
              }}
              className={`sidebar-item px-4 py-3 rounded flex items-center space-x-3 ${activeTab === "upload" ? "active" : ""}`}
            >
              <Database className={`h-5 w-5 ${activeTab === "upload" ? "text-sky-400" : "text-slate-400"}`} />
              <span>Data Center</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation("interactive-map")
              }}
              className={`sidebar-item px-4 py-3 rounded flex items-center space-x-3 ${activeTab === "interactive-map" ? "active" : ""}`}
            >
              <Globe className={`h-5 w-5 ${activeTab === "interactive-map" ? "text-sky-400" : "text-slate-400"}`} />
              <span>Map View</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation("predictions")
              }}
              className={`sidebar-item px-4 py-3 rounded flex items-center space-x-3 ${activeTab === "predictions" ? "active" : ""}`}
            >
              <BarChart3 className={`h-5 w-5 ${activeTab === "predictions" ? "text-sky-400" : "text-slate-400"}`} />
              <span>Predictions</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation("anomalies")
              }}
              className={`sidebar-item px-4 py-3 rounded flex items-center space-x-3 ${activeTab === "anomalies" ? "active" : ""}`}
            >
              <Shield className={`h-5 w-5 ${activeTab === "anomalies" ? "text-sky-400" : "text-slate-400"}`} />
              <span>Anomaly Detection</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation("settings")
              }}
              className={`sidebar-item px-4 py-3 rounded flex items-center space-x-3 ${activeTab === "settings" ? "active" : ""}`}
            >
              <Settings className={`h-5 w-5 ${activeTab === "settings" ? "text-sky-400" : "text-slate-400"}`} />
              <span>Settings</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation("tableau-dashboard")
              }}
              className={`sidebar-item px-4 py-3 rounded flex items-center space-x-3 ${activeTab === "tableau-dashboard" ? "active" : ""}`}
            >
              <BarChart3
                className={`h-5 w-5 ${activeTab === "tableau-dashboard" ? "text-sky-400" : "text-slate-400"}`}
              />
              <span>Tableau Analysis</span>
            </a>
          </nav>

          <div className="mt-8 pt-8 border-t border-slate-700/50">
            <div className="text-xs uppercase text-slate-500 font-semibold mb-2">System Status</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Freshness</span>
                <span className="text-xs text-sky-400">Live</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">API Status</span>
                <span className="text-xs text-green-400">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Model Version</span>
                <span className="text-xs">ARIMA 5.1.0</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <WaterQualityDashboard
              ref={dashboardRef}
              initialWaterQualityData={waterQualityData}
              initialPredictionData={predictionData}
              activeTab={activeTab}
            />
          )}
        </main>

        {/* Right Sidebar - Simplified alerts without "View details" */}
        <aside className="w-full md:w-72 p-4 glass-card m-4 rounded-lg hidden lg:block">
          <div className="text-center mb-6">
            <div className="text-sm text-slate-400">SYSTEM TIME</div>
            <div className="text-4xl font-mono text-sky-400 glow">{currentTime}</div>
            <div className="text-sm mt-1">{currentDate}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <div className="text-xs text-slate-400">Uptime</div>
              <div className="text-lg font-mono">14d 06:42</div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <div className="text-xs text-slate-400">Time Zone</div>
              <div className="text-lg font-mono">UTC+05:30</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="action-button bg-slate-800/70 hover:bg-slate-700/70 p-4 rounded-lg flex flex-col items-center justify-center transition-all"
                onClick={() => handleButtonClick("refresh")}
              >
                <RefreshCw className="h-6 w-6 text-sky-400 mb-2" />
                <span className="text-xs">Refresh Data</span>
              </button>
              <button
                className="action-button bg-slate-800/70 hover:bg-slate-700/70 p-4 rounded-lg flex flex-col items-center justify-center transition-all"
                onClick={() => handleButtonClick("upload")}
              >
                <Upload className="h-6 w-6 text-sky-400 mb-2" />
                <span className="text-xs">Upload CSV</span>
              </button>
              <button
                className="action-button bg-slate-800/70 hover:bg-slate-700/70 p-4 rounded-lg flex flex-col items-center justify-center transition-all"
                onClick={() => handleButtonClick("anomaly")}
              >
                <AlertTriangle className="h-6 w-6 text-sky-400 mb-2" />
                <span className="text-xs">Anomaly Scan</span>
              </button>
              <button
                className="action-button bg-slate-800/70 hover:bg-slate-700/70 p-4 rounded-lg flex flex-col items-center justify-center transition-all"
                onClick={() => handleButtonClick("prediction-state")}
              >
                <LineChart className="h-6 w-6 text-sky-400 mb-2" />
                <span className="text-xs">Prediction State</span>
              </button>
              <button
                className="action-button bg-slate-800/70 hover:bg-slate-700/70 p-4 rounded-lg flex flex-col items-center justify-center transition-all"
                onClick={() => handleButtonClick("tableau-dashboard")}
              >
                <BarChart3 className="h-6 w-6 text-sky-400 mb-2" />
                <span className="text-xs">Tableau View</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Alerts</h3>
            <div className="space-y-3">
              {waterNewsAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`alert-item block ${
                    alert.type === "critical"
                      ? "bg-red-900/20 border border-red-500/30"
                      : alert.type === "warning"
                        ? "bg-amber-900/20 border border-amber-500/30"
                        : "bg-slate-800/50"
                  } p-3 rounded-lg`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-sm font-medium ${
                        alert.type === "critical"
                          ? "text-red-400"
                          : alert.type === "warning"
                            ? "text-amber-400"
                            : "text-slate-300"
                      }`}
                    >
                      {alert.title}
                    </span>
                    <span className="text-xs text-slate-400">{alert.time}</span>
                  </div>
                  <p className="text-xs mt-1 truncate">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
