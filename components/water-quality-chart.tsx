"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
  }[]
}

interface WaterQualityChartProps {
  data: ChartData
  type: "line" | "bar" | "multiLine"
  title: string
  height?: number
}

export default function WaterQualityChart({ data, type, title, height = 300 }: WaterQualityChartProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [mounted, setMounted] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    setMounted(true)

    // Add resize listener for responsive charts
    const handleResize = () => {
      if (chartRef.current) {
        setContainerWidth(chartRef.current.parentElement?.clientWidth || 0)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  useEffect(() => {
    if (!chartRef.current || !mounted) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    const chartType = type === "multiLine" ? "line" : type

    // Adjust font sizes based on container width
    const fontSize = containerWidth < 400 ? 10 : containerWidth < 600 ? 12 : 14
    const titleFontSize = containerWidth < 400 ? 14 : containerWidth < 600 ? 16 : 18

    chartInstance.current = new Chart(ctx, {
      type: chartType,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: titleFontSize,
            },
          },
          legend: {
            position: "top",
            labels: {
              font: {
                size: fontSize,
              },
              boxWidth: containerWidth < 400 ? 10 : 12,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
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
              text: type === "multiLine" ? "Value" : "Water Quality Index",
              font: {
                size: fontSize,
              },
            },
            beginAtZero: false,
            ticks: {
              font: {
                size: fontSize,
              },
            },
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, type, title, mounted, containerWidth])

  if (!mounted) {
    return <div className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center">Loading chart...</div>
  }

  return (
    <div style={{ height: `${height}px` }} className="w-full" suppressHydrationWarning>
      <canvas ref={chartRef}></canvas>
    </div>
  )
}
