"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PredictionData } from "@/lib/types"

Chart.register(...registerables)

interface WaterQualityPredictionProps {
  data: PredictionData
  showConfidenceIntervals?: boolean
}

export default function WaterQualityPrediction({ data, showConfidenceIntervals = true }: WaterQualityPredictionProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const chartInstance = useRef<Chart | null>(null)
  // Initialize state with the prop value but don't update it when the prop changes
  const [confidenceInterval, setConfidenceInterval] = useState<boolean>(showConfidenceIntervals)
  const [viewMode, setViewMode] = useState<"all" | "historical" | "prediction">("all")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only update the confidenceInterval state when the prop changes and the component is mounted
  useEffect(() => {
    if (mounted) {
      setConfidenceInterval(showConfidenceIntervals)
    }
  }, [showConfidenceIntervals, mounted])

  useEffect(() => {
    if (!chartRef.current || !mounted) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Prepare data based on view mode
    const chartData = {
      labels: [...data.historicalYears, ...data.predictionYears],
      datasets: [
        {
          label: "Historical WQI",
          data: [...data.historicalValues, ...Array(data.predictionValues.length).fill(null)],
          borderColor: "rgba(53, 162, 235, 1)",
          backgroundColor: "rgba(53, 162, 235, 0.5)",
          pointRadius: 3,
        },
        {
          label: "Predicted WQI",
          data: [...Array(data.historicalValues.length).fill(null), ...data.predictionValues],
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          pointRadius: 3,
          borderDash: [5, 5],
        },
      ],
    }

    if (confidenceInterval) {
      chartData.datasets.push(
        {
          label: "Upper Confidence Interval",
          data: [...Array(data.historicalValues.length).fill(null), ...data.upperCI],
          borderColor: "rgba(255, 99, 132, 0.3)",
          backgroundColor: "rgba(255, 99, 132, 0.1)",
          pointRadius: 0,
          borderDash: [2, 2],
          fill: "+1",
        },
        {
          label: "Lower Confidence Interval",
          data: [...Array(data.historicalValues.length).fill(null), ...data.lowerCI],
          borderColor: "rgba(255, 99, 132, 0.3)",
          backgroundColor: "rgba(255, 99, 132, 0.1)",
          pointRadius: 0,
          borderDash: [2, 2],
          fill: false,
        },
      )
    }

    // Filter data based on view mode
    if (viewMode === "historical") {
      chartData.labels = data.historicalYears
      chartData.datasets = [chartData.datasets[0]]
    } else if (viewMode === "prediction") {
      chartData.labels = data.predictionYears
      chartData.datasets = chartData.datasets.filter((_, index) => index !== 0)
      chartData.datasets[0].data = data.predictionValues
    }

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Water Quality Index Prediction (15 Years)",
            font: {
              size: 16,
            },
          },
          legend: {
            position: "top",
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Year",
            },
          },
          y: {
            title: {
              display: true,
              text: "Water Quality Index",
            },
            min: Math.min(...data.lowerCI, ...data.historicalValues) * 0.9,
            max: Math.max(...data.upperCI, ...data.historicalValues) * 1.1,
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, confidenceInterval, viewMode, mounted])

  if (!mounted) {
    return (
      <div className="h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
        Loading prediction chart...
      </div>
    )
  }

  return (
    <div className="space-y-4" suppressHydrationWarning>
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Data</TabsTrigger>
            <TabsTrigger value="historical">Historical</TabsTrigger>
            <TabsTrigger value="prediction">Prediction</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant={confidenceInterval ? "default" : "outline"}
          onClick={() => setConfidenceInterval(!confidenceInterval)}
          className="ml-auto"
        >
          {confidenceInterval ? "Hide Confidence Interval" : "Show Confidence Interval"}
        </Button>
      </div>

      <div className="h-[400px]">
        <canvas ref={chartRef}></canvas>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-2">Model Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold">Model Type</p>
              <p>ARIMA(5,1,0)</p>
            </div>
            <div>
              <p className="font-semibold">RMSE</p>
              <p>{data.rmse.toFixed(3)}</p>
            </div>
            <div>
              <p className="font-semibold">Confidence Level</p>
              <p>95%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
