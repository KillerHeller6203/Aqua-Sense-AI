"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Save } from "lucide-react"

interface DashboardSettings {
  theme: "light" | "dark" | "system"
  showConfidenceIntervals: boolean
  mapStyle: "basic" | "detailed"
  refreshInterval: number
  defaultTab: string
  chartColors: "default" | "colorblind" | "monochrome"
}

const defaultSettings: DashboardSettings = {
  theme: "light",
  showConfidenceIntervals: true,
  mapStyle: "detailed",
  refreshInterval: 0, // 0 means no auto-refresh
  defaultTab: "overview",
  chartColors: "default",
}

interface DashboardSettingsProps {
  onSettingsChange: (settings: DashboardSettings) => void
}

export default function DashboardSettings({ onSettingsChange }: DashboardSettingsProps) {
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings)
  const [isSaved, setIsSaved] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load settings from localStorage only once on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("dashboardSettings")
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(parsedSettings)
        // Don't call onSettingsChange here to avoid infinite loop
      } catch (err) {
        console.error("Failed to parse saved settings", err)
      }
    }
    setIsInitialized(true)
  }, [])

  // Use useCallback to memoize the handleSettingChange function
  const handleSettingChange = useCallback(<K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value }
      return newSettings
    })
    setIsSaved(false)
  }, [])

  // Use useCallback to memoize the saveSettings function
  const saveSettings = useCallback(() => {
    localStorage.setItem("dashboardSettings", JSON.stringify(settings))
    onSettingsChange(settings)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }, [settings, onSettingsChange])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Settings</CardTitle>
        <CardDescription>Customize your water quality dashboard experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme" className="text-sm font-medium">
              Theme
            </Label>
            <Select
              value={settings.theme}
              onValueChange={(value) => handleSettingChange("theme", value as "light" | "dark" | "system")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="confidence-intervals" className="text-sm font-medium">
              Show Confidence Intervals
            </Label>
            <Switch
              id="confidence-intervals"
              checked={settings.showConfidenceIntervals}
              onCheckedChange={(checked) => handleSettingChange("showConfidenceIntervals", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="map-style" className="text-sm font-medium">
              Map Style
            </Label>
            <Select
              value={settings.mapStyle}
              onValueChange={(value) => handleSettingChange("mapStyle", value as "basic" | "detailed")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select map style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="refresh-interval" className="text-sm font-medium">
                Auto-Refresh Interval (minutes)
              </Label>
              <span className="text-sm font-medium">
                {settings.refreshInterval === 0 ? "Off" : `${settings.refreshInterval}m`}
              </span>
            </div>
            <Slider
              id="refresh-interval"
              min={0}
              max={60}
              step={5}
              value={[settings.refreshInterval]}
              onValueChange={(value) => handleSettingChange("refreshInterval", value[0])}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="default-tab" className="text-sm font-medium">
              Default Tab
            </Label>
            <Select value={settings.defaultTab} onValueChange={(value) => handleSettingChange("defaultTab", value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select default tab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="trends">Historical Trends</SelectItem>
                <SelectItem value="predictions">Predictions</SelectItem>
                <SelectItem value="map">Geographic Data</SelectItem>
                <SelectItem value="state-prediction">State Prediction</SelectItem>
                <SelectItem value="upload">Upload Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="chart-colors" className="text-sm font-medium">
              Chart Color Scheme
            </Label>
            <Select
              value={settings.chartColors}
              onValueChange={(value) =>
                handleSettingChange("chartColors", value as "default" | "colorblind" | "monochrome")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select color scheme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="colorblind">Colorblind Friendly</SelectItem>
                <SelectItem value="monochrome">Monochrome</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={saveSettings} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {isSaved ? "Saved!" : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  )
}
