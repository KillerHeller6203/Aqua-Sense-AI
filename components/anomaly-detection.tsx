"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { AlertCircle } from "lucide-react"
import { Chart, registerables } from "chart.js"
import type { WaterQualityData } from "@/lib/types"

Chart.register(...registerables)

interface AnomalyDetectionProps {
  data: WaterQualityData
}

export default function AnomalyDetection({ data }: AnomalyDetectionProps) {
  const [anomalies, setAnomalies] = useState<number[]>([])
  const [threshold, setThreshold] = useState<number>(2.0)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [tfError, setTfError] = useState<boolean>(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const chartInstance = useRef<Chart | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tfRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)

    // Load TensorFlow.js dynamically with error handling
    const loadTensorFlow = async () => {
      try {
        const tf = await import("@tensorflow/tfjs").catch((err) => {
          console.error("Failed to load TensorFlow.js:", err)
          setTfError(true)
          return null
        })

        if (!tf) return
        tfRef.current = tf
      } catch (error) {
        console.error("Error loading TensorFlow.js:", error)
        setTfError(true)
      }
    }

    loadTensorFlow()

    // Add resize listener for responsive charts
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  // Detect anomalies using TensorFlow.js
  const detectAnomalies = async () => {
    if (!tfRef.current) {
      setTfError(true)
      return
    }

    setIsProcessing(true)
    try {
      // Get WQI data
      const wqiData = data.yearlyWqi.datasets[0].data
      const labels = data.yearlyWqi.labels

      // Convert to tensor
      const tensor = tfRef.current.tensor1d(wqiData)

      // Calculate mean and standard deviation
      const mean = tensor.mean()
      const std = tensor.sub(mean).pow(2).mean().sqrt()

      // Calculate z-scores
      const zScores = tensor.sub(mean).div(std)

      // Find indices where absolute z-score exceeds threshold
      const zScoresArray = await zScores.abs().array()
      const anomalyIndices = zScoresArray
        .map((score: number, index: number) => (score > threshold ? index : -1))
        .filter((index: number) => index !== -1)

      setAnomalies(anomalyIndices)

      // Update chart
      updateChart(wqiData, labels, anomalyIndices)

      // Clean up tensors to prevent memory leaks
      tensor.dispose()
      mean.dispose()
      std.dispose()
      zScores.dispose()
    } catch (error) {
      console.error("Error detecting anomalies:", error)
      setTfError(true)
    } finally {
      setIsProcessing(false)
    }
  }

  // Update chart with anomalies highlighted
  const updateChart = (wqiData: number[], labels: string[], anomalyIndices: number[]) => {
    if (!chartRef.current || !mounted) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Create anomaly dataset
    const anomalyData = wqiData.map((_, i) => (anomalyIndices.includes(i) ? wqiData[i] : null))

    // Adjust font sizes based on container width
    const fontSize = containerWidth < 400 ? 10 : containerWidth < 600 ? 12 : 14
    const titleFontSize = containerWidth < 400 ? 14 : containerWidth < 600 ? 16 : 18

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Water Quality Index",
            data: wqiData,
            borderColor: "rgb(53, 162, 235)",
            backgroundColor: "rgba(53, 162, 235, 0.5)",
            tension: 0.1,
          },
          {
            label: "Anomalies",
            data: anomalyData,
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.8)",
            pointRadius: 6,
            pointHoverRadius: 8,
            pointStyle: "triangle",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Water Quality Anomaly Detection",
            font: {
              size: titleFontSize,
            },
          },
          legend: {
            labels: {
              font: {
                size: fontSize,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex
                if (anomalyIndices.includes(index)) {
                  return `Anomaly: ${context.raw} (${(Math.abs(wqiData[index] - wqiData.reduce((a, b) => a + b, 0) / wqiData.length)).toFixed(2)} from mean)`
                }
                return `WQI: ${context.raw}`
              },
            },
            bodyFont: {
              size: fontSize,
            },
            titleFont: {
              size: fontSize,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Year",
              font: {
                size: fontSize,
              },
            },
            ticks: {
              font: {
                size: fontSize,
              },
              maxRotation: 45,
              minRotation: 45,
            },
          },
          y: {
            title: {
              display: true,
              text: "Water Quality Index",
              font: {
                size: fontSize,
              },
            },
            ticks: {
              font: {
                size: fontSize,
              },
            },
          },
        },
      },
    })
  }

  // Run anomaly detection when component mounts
  useEffect(() => {
    if (mounted && data && !tfError && tfRef.current) {
      detectAnomalies()
    }
  }, [mounted, data, threshold, tfError])

  if (!mounted) {
    return (
      <div className="h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
        Loading anomaly detection...
      </div>
    )
  }

  // Fallback if TensorFlow.js fails to load
  if (tfError) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Water Quality Anomaly Detection</CardTitle>
          <CardDescription>Detecting unusual patterns in water quality data</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <Alert className="bg-red-50 border-red-200 mb-4">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Error Loading Anomaly Detection</AlertTitle>
            <AlertDescription className="text-red-700">
              There was an error loading the anomaly detection module. This feature requires TensorFlow.js which may not
              be supported in your browser.
            </AlertDescription>
          </Alert>

          <div className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center">
            <div className="text-center max-w-md p-4">
              <h3 className="text-lg font-medium mb-2">Alternative Analysis</h3>
              <p className="text-sm text-gray-600 mb-4">
                You can still analyze the water quality data using the other dashboard features like the historical
                trends and predictions.
              </p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>Water Quality Anomaly Detection</CardTitle>
        <CardDescription>Detecting unusual patterns in water quality data</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4" ref={containerRef}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="space-y-1 flex-1">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Sensitivity Threshold</span>
              <span className="text-sm text-muted-foreground">{threshold.toFixed(1)}</span>
            </div>
            <Slider
              value={[threshold]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setThreshold(value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Lower values detect more anomalies, higher values detect only extreme outliers
            </p>
          </div>
          <Button onClick={detectAnomalies} disabled={isProcessing} className="w-full sm:w-auto">
            {isProcessing ? "Processing..." : "Detect Anomalies"}
          </Button>
        </div>

        {anomalies.length > 0 && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Anomalies Detected</AlertTitle>
            <AlertDescription className="text-amber-700">
              Found {anomalies.length} anomalies in the water quality data. These may indicate pollution events,
              measurement errors, or significant environmental changes.
            </AlertDescription>
          </Alert>
        )}

        <div className="h-[300px] sm:h-[400px]">
          <canvas ref={chartRef}></canvas>
        </div>

        {anomalies.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium mb-2">Anomaly Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {anomalies.map((index) => (
                <div key={index} className="p-2 bg-white border rounded-md">
                  <p className="text-sm font-medium">Year: {data.yearlyWqi.labels[index]}</p>
                  <p className="text-sm">WQI Value: {data.yearlyWqi.datasets[0].data[index]}</p>
                  <p className="text-xs text-muted-foreground">
                    Deviation:{" "}
                    {Math.abs(
                      data.yearlyWqi.datasets[0].data[index] -
                        data.yearlyWqi.datasets[0].data.reduce((a, b) => a + b, 0) /
                          data.yearlyWqi.datasets[0].data.length,
                    ).toFixed(2)}{" "}
                    from mean
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
