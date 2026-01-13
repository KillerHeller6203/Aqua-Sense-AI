"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Chart, registerables } from "chart.js"
import annotationPlugin from "chartjs-plugin-annotation"
import type { PredictionData } from "@/lib/types"

Chart.register(...registerables, annotationPlugin)

// Sample precomputed forecast data (in a real app, this would be loaded from an API or JSON file)
const precomputedForecasts = {
  monthly: {
    labels: Array.from({ length: 60 }, (_, i) => {
      const date = new Date(2023, 0, 1)
      date.setMonth(date.getMonth() + i)
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short" })
    }),
    wqi: Array.from({ length: 60 }, (_, i) => {
      // Start at 70 with seasonal variations and slight upward trend
      return 70 + Math.sin((i / 6) * Math.PI) * 3 + i * 0.05 + (Math.random() - 0.5) * 1.5
    }),
    do: Array.from({ length: 60 }, (_, i) => {
      // Dissolved oxygen with seasonal variations
      return 6.5 + Math.sin((i / 6) * Math.PI) * 0.8 + (Math.random() - 0.5) * 0.3
    }),
    ph: Array.from({ length: 60 }, (_, i) => {
      // pH with slight variations
      return 7.2 + Math.sin((i / 12) * Math.PI) * 0.2 + (Math.random() - 0.5) * 0.1
    }),
    nitrates: Array.from({ length: 60 }, (_, i) => {
      // Nitrates with seasonal variations and slight downward trend
      return 20 + Math.sin((i / 6) * Math.PI) * 5 - i * 0.03 + (Math.random() - 0.5) * 2
    }),
  },
  seasonal: {
    winter: { wqi: 68, do: 7.8, ph: 7.1, nitrates: 18 },
    spring: { wqi: 72, do: 6.9, ph: 7.3, nitrates: 22 },
    summer: { wqi: 65, do: 5.8, ph: 7.5, nitrates: 25 },
    fall: { wqi: 70, do: 6.5, ph: 7.2, nitrates: 20 },
  },
  scenarios: {
    baseline: Array.from({ length: 15 }, (_, i) => 70 + i * 0.2),
    improved: Array.from({ length: 15 }, (_, i) => 70 + i * 0.5),
    degraded: Array.from({ length: 15 }, (_, i) => 70 - i * 0.3),
  },
}

interface AdvancedForecastingProps {
  data: PredictionData
}

export default function AdvancedForecasting({ data }: AdvancedForecastingProps) {
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 24]) // Default to 2 years
  const [parameter, setParameter] = useState<string>("wqi")
  const [viewMode, setViewMode] = useState<string>("monthly")
  const [scenario, setScenario] = useState<string>("baseline")
  const [mounted, setMounted] = useState<boolean>(false)
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const chartInstance = useRef<Chart | null>(null)
  const seasonalChartRef = useRef<HTMLCanvasElement | null>(null)
  const seasonalChartInstance = useRef<Chart | null>(null)
  const scenarioChartRef = useRef<HTMLCanvasElement | null>(null)
  const scenarioChartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
      if (seasonalChartInstance.current) {
        seasonalChartInstance.current.destroy()
      }
      if (scenarioChartInstance.current) {
        scenarioChartInstance.current.destroy()
      }
    }
  }, [])

  // Update monthly forecast chart
  useEffect(() => {
    if (!chartRef.current || !mounted) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Get data for selected parameter and time range
    const labels = precomputedForecasts.monthly.labels.slice(timeRange[0], timeRange[1])
    const values = precomputedForecasts.monthly[parameter as keyof typeof precomputedForecasts.monthly]

    if (!Array.isArray(values)) return

    const selectedData = values.slice(timeRange[0], timeRange[1])

    // Calculate trend line
    const xValues = Array.from({ length: selectedData.length }, (_, i) => i)
    const n = selectedData.length
    const sumX = xValues.reduce((a, b) => a + b, 0)
    const sumY = selectedData.reduce((a, b) => a + b, 0)
    const sumXY = xValues.reduce((a, b, i) => a + b * selectedData[i], 0)
    const sumXX = xValues.reduce((a, b) => a + b * b, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    const trendData = xValues.map((x) => intercept + slope * x)

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: getParameterLabel(parameter),
            data: selectedData,
            borderColor: getParameterColor(parameter),
            backgroundColor: getParameterColor(parameter, 0.2),
            tension: 0.3,
            fill: true,
          },
          {
            label: "Trend",
            data: trendData,
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${getParameterLabel(parameter)} Forecast (${labels[0]} - ${labels[labels.length - 1]})`,
            font: { size: 16 },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
          annotation: {
            annotations: {
              line1: {
                type: "line",
                yMin: getThresholdValue(parameter),
                yMax: getThresholdValue(parameter),
                borderColor: "rgba(255, 99, 132, 0.5)",
                borderWidth: 2,
                borderDash: [6, 6],
                label: {
                  display: true,
                  content: `${getParameterLabel(parameter)} Threshold`,
                  position: "end",
                },
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Month",
            },
          },
          y: {
            title: {
              display: true,
              text: getParameterLabel(parameter),
            },
            suggestedMin: getParameterMin(parameter),
            suggestedMax: getParameterMax(parameter),
          },
        },
      },
    })
  }, [timeRange, parameter, mounted])

  // Update seasonal chart
  useEffect(() => {
    if (!seasonalChartRef.current || !mounted) return

    // Destroy existing chart
    if (seasonalChartInstance.current) {
      seasonalChartInstance.current.destroy()
    }

    const ctx = seasonalChartRef.current.getContext("2d")
    if (!ctx) return

    const seasons = ["winter", "spring", "summer", "fall"]
    const values = seasons.map(
      (season) =>
        precomputedForecasts.seasonal[season as keyof typeof precomputedForecasts.seasonal][
          parameter as keyof typeof precomputedForecasts.seasonal.winter
        ],
    )

    seasonalChartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: seasons.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
        datasets: [
          {
            label: getParameterLabel(parameter),
            data: values,
            backgroundColor: [
              "rgba(54, 162, 235, 0.6)",
              "rgba(75, 192, 192, 0.6)",
              "rgba(255, 99, 132, 0.6)",
              "rgba(255, 159, 64, 0.6)",
            ],
            borderColor: [
              "rgba(54, 162, 235, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(255, 99, 132, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Seasonal ${getParameterLabel(parameter)} Variations`,
            font: { size: 16 },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: getParameterLabel(parameter),
            },
          },
        },
      },
    })
  }, [parameter, mounted])

  // Update scenario chart
  useEffect(() => {
    if (!scenarioChartRef.current || !mounted) return

    // Destroy existing chart
    if (scenarioChartInstance.current) {
      scenarioChartInstance.current.destroy()
    }

    const ctx = scenarioChartRef.current.getContext("2d")
    if (!ctx) return

    const years = Array.from({ length: 15 }, (_, i) => (2023 + i).toString())

    scenarioChartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: years,
        datasets: [
          {
            label: "Baseline Scenario",
            data: precomputedForecasts.scenarios.baseline,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderWidth: scenario === "baseline" ? 3 : 1,
            tension: 0.3,
          },
          {
            label: "Improved Management",
            data: precomputedForecasts.scenarios.improved,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderWidth: scenario === "improved" ? 3 : 1,
            tension: 0.3,
          },
          {
            label: "Degraded Conditions",
            data: precomputedForecasts.scenarios.degraded,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderWidth: scenario === "degraded" ? 3 : 1,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Long-term WQI Scenarios",
            font: { size: 16 },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          y: {
            title: {
              display: true,
              text: "Water Quality Index",
            },
            suggestedMin: 60,
            suggestedMax: 80,
          },
        },
      },
    })
  }, [scenario, mounted])

  // Helper functions
  const getParameterLabel = (param: string): string => {
    switch (param) {
      case "wqi":
        return "Water Quality Index"
      case "do":
        return "Dissolved Oxygen (mg/L)"
      case "ph":
        return "pH"
      case "nitrates":
        return "Nitrates (mg/L)"
      default:
        return param
    }
  }

  const getParameterColor = (param: string, alpha = 1): string => {
    switch (param) {
      case "wqi":
        return `rgba(53, 162, 235, ${alpha})`
      case "do":
        return `rgba(75, 192, 192, ${alpha})`
      case "ph":
        return `rgba(153, 102, 255, ${alpha})`
      case "nitrates":
        return `rgba(255, 99, 132, ${alpha})`
      default:
        return `rgba(201, 203, 207, ${alpha})`
    }
  }

  const getThresholdValue = (param: string): number => {
    switch (param) {
      case "wqi":
        return 65 // Fair water quality threshold
      case "do":
        return 5 // Minimum DO for aquatic life
      case "ph":
        return 6.5 // Lower pH threshold
      case "nitrates":
        return 10 // EPA drinking water standard
      default:
        return 0
    }
  }

  const getParameterMin = (param: string): number => {
    switch (param) {
      case "wqi":
        return 50
      case "do":
        return 4
      case "ph":
        return 6
      case "nitrates":
        return 0
      default:
        return 0
    }
  }

  const getParameterMax = (param: string): number => {
    switch (param) {
      case "wqi":
        return 90
      case "do":
        return 10
      case "ph":
        return 9
      case "nitrates":
        return 30
      default:
        return 100
    }
  }

  if (!mounted) {
    return (
      <div className="h-[500px] bg-gray-100 rounded-md flex items-center justify-center">Loading forecasting...</div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Water Quality Forecasting</CardTitle>
        <CardDescription>Explore detailed forecasts and scenarios for water quality parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="monthly" onValueChange={setViewMode}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Monthly Forecast</TabsTrigger>
            <TabsTrigger value="seasonal">Seasonal Patterns</TabsTrigger>
            <TabsTrigger value="scenarios">Future Scenarios</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="w-full md:w-auto">
                <label className="text-sm font-medium">Parameter</label>
                <Select value={parameter} onValueChange={setParameter}>
                  <SelectTrigger className="w-[180px] mt-1">
                    <SelectValue placeholder="Select parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wqi">Water Quality Index</SelectItem>
                    <SelectItem value="do">Dissolved Oxygen</SelectItem>
                    <SelectItem value="ph">pH</SelectItem>
                    <SelectItem value="nitrates">Nitrates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Time Range</span>
                  <span className="text-sm text-muted-foreground">
                    {precomputedForecasts.monthly.labels[timeRange[0]]} -{" "}
                    {precomputedForecasts.monthly.labels[timeRange[1] - 1]}
                  </span>
                </div>
                <Slider
                  value={timeRange}
                  min={0}
                  max={60}
                  step={1}
                  minStepsBetweenThumbs={6}
                  onValueChange={(value) => setTimeRange([value[0], value[1]])}
                  className="w-full"
                />
              </div>
            </div>

            <div className="h-[400px]">
              <canvas ref={chartRef}></canvas>
            </div>

            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium mb-2">Forecast Insights</h3>
              <p className="text-sm">
                This forecast shows projected {getParameterLabel(parameter).toLowerCase()} values based on historical
                trends and seasonal patterns. The trend line indicates the overall direction of change.
              </p>
              <p className="text-sm mt-2">
                The dashed horizontal line represents the threshold value for{" "}
                {getParameterLabel(parameter).toLowerCase()}.
                {parameter === "wqi" && " Values below this threshold indicate marginal water quality conditions."}
                {parameter === "do" && " Values below this threshold may be harmful to aquatic life."}
                {parameter === "ph" && " Values outside the optimal range may affect aquatic ecosystems."}
                {parameter === "nitrates" && " Values above this threshold exceed drinking water standards."}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="seasonal" className="space-y-4">
            <div className="w-full md:w-auto mb-4">
              <label className="text-sm font-medium">Parameter</label>
              <Select value={parameter} onValueChange={setParameter}>
                <SelectTrigger className="w-[180px] mt-1">
                  <SelectValue placeholder="Select parameter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wqi">Water Quality Index</SelectItem>
                  <SelectItem value="do">Dissolved Oxygen</SelectItem>
                  <SelectItem value="ph">pH</SelectItem>
                  <SelectItem value="nitrates">Nitrates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-[400px]">
              <canvas ref={seasonalChartRef}></canvas>
            </div>

            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium mb-2">Seasonal Patterns</h3>
              <p className="text-sm">
                Water quality parameters typically follow seasonal patterns due to temperature changes, precipitation,
                agricultural activities, and other environmental factors.
              </p>
              <ul className="text-sm mt-2 space-y-1 list-disc pl-5">
                <li>
                  <strong>Winter:</strong> Often shows higher dissolved oxygen due to colder temperatures.
                </li>
                <li>
                  <strong>Spring:</strong> May show increased nitrates due to agricultural runoff from spring rains.
                </li>
                <li>
                  <strong>Summer:</strong> Higher temperatures can lead to lower dissolved oxygen and increased algal
                  growth.
                </li>
                <li>
                  <strong>Fall:</strong> Typically shows moderate values as temperatures decrease and rainfall patterns
                  change.
                </li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="w-full md:w-auto mb-4">
              <label className="text-sm font-medium">Highlight Scenario</label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger className="w-[220px] mt-1">
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baseline">Baseline Scenario</SelectItem>
                  <SelectItem value="improved">Improved Management</SelectItem>
                  <SelectItem value="degraded">Degraded Conditions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-[400px]">
              <canvas ref={scenarioChartRef}></canvas>
            </div>

            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium mb-2">Scenario Descriptions</h3>
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium">Baseline Scenario</h4>
                  <p className="text-sm">
                    Assumes current policies and practices continue with gradual improvements in water quality
                    management. This scenario projects a slow but steady increase in WQI over time.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Improved Management</h4>
                  <p className="text-sm">
                    Assumes implementation of enhanced pollution controls, better wastewater treatment, and stricter
                    enforcement of environmental regulations. This scenario shows more significant improvements in water
                    quality.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Degraded Conditions</h4>
                  <p className="text-sm">
                    Assumes relaxation of environmental protections, increased industrial discharge, or climate change
                    impacts. This scenario shows declining water quality over time.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
