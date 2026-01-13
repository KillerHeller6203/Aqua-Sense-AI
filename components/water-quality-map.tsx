"use client"

import { useEffect, useRef, useState } from "react"
import type { GeoData } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getWQIColor, getWQITextColor, getWQICategory } from "@/lib/wqi-calculator"

interface WaterQualityMapProps {
  data: GeoData[]
  mapStyle?: "basic" | "detailed"
}

// All Indian states with their coordinates
const INDIAN_STATES = {
  "Andhra Pradesh": { x: 400, y: 550, path: "M380,520 L420,520 L450,580 L400,600 L350,580 Z" },
  "Arunachal Pradesh": { x: 650, y: 250, path: "M630,230 L670,230 L680,270 L630,270 Z" },
  Assam: { x: 600, y: 280, path: "M580,260 L620,260 L630,300 L580,300 Z" },
  Bihar: { x: 500, y: 350, path: "M480,330 L520,330 L530,370 L480,370 Z" },
  Chhattisgarh: { x: 450, y: 400, path: "M430,380 L470,380 L480,420 L430,420 Z" },
  Goa: { x: 300, y: 520, path: "M290,510 L310,510 L310,530 L290,530 Z" },
  Gujarat: { x: 250, y: 350, path: "M200,320 L280,320 L300,380 L230,400 L200,350 Z" },
  Haryana: { x: 320, y: 250, path: "M300,230 L340,230 L350,270 L300,270 Z" },
  "Himachal Pradesh": { x: 330, y: 200, path: "M310,180 L350,180 L360,220 L310,220 Z" },
  Jharkhand: { x: 520, y: 380, path: "M500,360 L540,360 L550,400 L500,400 Z" },
  Karnataka: { x: 320, y: 520, path: "M280,480 L360,480 L380,560 L280,560 Z" },
  Kerala: { x: 320, y: 600, path: "M300,580 L340,580 L340,620 L300,620 Z" },
  "Madhya Pradesh": { x: 380, y: 350, path: "M320,320 L440,320 L460,380 L320,380 Z" },
  Maharashtra: { x: 320, y: 450, path: "M260,420 L380,420 L400,480 L260,480 Z" },
  Manipur: { x: 630, y: 320, path: "M620,310 L640,310 L640,330 L620,330 Z" },
  Meghalaya: { x: 580, y: 310, path: "M560,300 L600,300 L600,320 L560,320 Z" },
  Mizoram: { x: 610, y: 350, path: "M600,340 L620,340 L620,360 L600,360 Z" },
  Nagaland: { x: 640, y: 300, path: "M630,290 L650,290 L650,310 L630,310 Z" },
  Odisha: { x: 500, y: 450, path: "M470,420 L530,420 L540,480 L470,480 Z" },
  Punjab: { x: 300, y: 220, path: "M280,200 L320,200 L330,240 L280,240 Z" },
  Rajasthan: { x: 280, y: 300, path: "M220,260 L340,260 L360,340 L220,340 Z" },
  Sikkim: { x: 550, y: 280, path: "M540,270 L560,270 L560,290 L540,290 Z" },
  "Tamil Nadu": { x: 350, y: 600, path: "M320,560 L380,560 L380,640 L320,640 Z" },
  Telangana: { x: 380, y: 480, path: "M350,450 L410,450 L420,510 L350,510 Z" },
  Tripura: { x: 590, y: 340, path: "M580,330 L600,330 L600,350 L580,350 Z" },
  "Uttar Pradesh": { x: 400, y: 300, path: "M340,270 L460,270 L480,330 L340,330 Z" },
  Uttarakhand: { x: 360, y: 230, path: "M340,210 L380,210 L390,250 L340,250 Z" },
  "West Bengal": { x: 550, y: 380, path: "M530,340 L570,340 L580,420 L530,420 Z" },
  Delhi: { x: 340, y: 270, path: "M335,265 L345,265 L345,275 L335,275 Z" },
  "Jammu and Kashmir": { x: 300, y: 150, path: "M250,120 L350,120 L350,180 L250,180 Z" },
  Ladakh: { x: 350, y: 120, path: "M300,90 L400,90 L400,150 L300,150 Z" },
  Puducherry: { x: 370, y: 580, path: "M365,575 L375,575 L375,585 L365,585 Z" },
  "Andaman and Nicobar Islands": { x: 650, y: 550, path: "M640,520 L660,520 L660,580 L640,580 Z" },
  Chandigarh: { x: 310, y: 230, path: "M308,228 L312,228 L312,232 L308,232 Z" },
  "Dadra and Nagar Haveli": { x: 270, y: 420, path: "M265,415 L275,415 L275,425 L265,425 Z" },
  "Daman and Diu": { x: 250, y: 400, path: "M245,395 L255,395 L255,405 L245,405 Z" },
  Lakshadweep: { x: 250, y: 580, path: "M245,575 L255,575 L255,585 L245,585 Z" },
}

export default function WaterQualityMap({ data, mapStyle = "detailed" }: WaterQualityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedState, setSelectedState] = useState<string>("all")
  const [mounted, setMounted] = useState(false)
  const [mapRendered, setMapRendered] = useState(false)

  // Get unique states
  const states = [...new Set(data.map((item) => item.state))]

  // Only render on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mapRef.current || !mounted) return

    // Use a timeout to ensure the DOM is fully rendered
    const renderTimer = setTimeout(() => {
      try {
        const mapContainer = mapRef.current
        if (!mapContainer) return

        mapContainer.innerHTML = ""

        // Create the map visualization
        createIndiaMap(mapContainer, filteredData(), mapStyle)
        setMapRendered(true)
      } catch (error) {
        console.error("Error rendering map:", error)
      }
    }, 500)

    return () => {
      clearTimeout(renderTimer)
      if (mapRef.current) {
        mapRef.current.innerHTML = ""
      }
    }
  }, [data, selectedState, mounted, mapStyle])

  function filteredData() {
    return selectedState === "all" ? data : data.filter((item) => item.state === selectedState)
  }

  if (!mounted) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-md flex items-center justify-center">Loading map...</div>
    )
  }

  return (
    <div className="space-y-4" suppressHydrationWarning>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Water Quality by Location</h3>
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div ref={mapRef} className="w-full h-[500px] bg-white rounded-md border" style={{ minHeight: "500px" }}></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {filteredData().map((item) => (
          <Card key={item.station} className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: getWQIColor(item.wqi) }}></div>
            <CardContent className="p-4">
              <h4 className="font-medium">{item.station}</h4>
              <p className="text-sm text-gray-500">
                {item.location}, {item.state}
              </p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm">WQI: {item.wqi.toFixed(1)}</span>
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: getWQIColor(item.wqi),
                    color: getWQITextColor(item.wqi),
                  }}
                >
                  {getWQICategory(item.wqi)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function createIndiaMap(container: HTMLDivElement, data: GeoData[], mapStyle: "basic" | "detailed") {
  try {
    const width = container.clientWidth || 800
    const height = 500

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", width.toString())
    svg.setAttribute("height", height.toString())
    svg.setAttribute("viewBox", "0 0 800 800")

    // Add a background
    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    background.setAttribute("width", "800")
    background.setAttribute("height", "800")
    background.setAttribute("fill", "#f8f9fa")
    svg.appendChild(background)

    // Add India outline
    if (mapStyle === "detailed") {
      // Detailed India map outline (more accurate)
      const indiaOutline = document.createElementNS("http://www.w3.org/2000/svg", "path")
      indiaOutline.setAttribute(
        "d",
        `
        M200,120 L400,90 L450,120 L500,150 L550,200 L600,250 L650,300 
        L680,350 L690,400 L680,450 L650,500 L600,550 L550,600 
        L500,650 L450,680 L400,690 L350,680 L300,650 L250,600 
        L200,550 L180,500 L170,450 L180,400 L200,350 L220,300 L200,250 L180,200 L200,120
      `,
      )
      indiaOutline.setAttribute("fill", "#e9ecef")
      indiaOutline.setAttribute("stroke", "#ced4da")
      indiaOutline.setAttribute("stroke-width", "2")
      svg.appendChild(indiaOutline)

      // Add state boundaries
      for (const [state, info] of Object.entries(INDIAN_STATES)) {
        const statePath = document.createElementNS("http://www.w3.org/2000/svg", "path")
        statePath.setAttribute("d", info.path)
        statePath.setAttribute("fill", "#f1f3f5")
        statePath.setAttribute("stroke", "#ced4da")
        statePath.setAttribute("stroke-width", "1")
        statePath.setAttribute("data-state", state)
        svg.appendChild(statePath)
      }
    } else {
      // Basic India map outline (simplified)
      const indiaPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
      indiaPath.setAttribute(
        "d",
        "M400,150 C550,150 650,300 650,450 C650,600 550,700 400,700 C250,700 150,600 150,450 C150,300 250,150 400,150 Z",
      )
      indiaPath.setAttribute("fill", "#e9ecef")
      indiaPath.setAttribute("stroke", "#ced4da")
      indiaPath.setAttribute("stroke-width", "2")
      svg.appendChild(indiaPath)
    }

    // Add state markers
    const stateData: Record<string, { count: number; totalWqi: number; stations: GeoData[] }> = {}
    data.forEach((item) => {
      if (!stateData[item.state]) {
        stateData[item.state] = {
          count: 0,
          totalWqi: 0,
          stations: [],
        }
      }
      stateData[item.state].count++
      stateData[item.state].totalWqi += item.wqi
      stateData[item.state].stations.push(item)
    })

    // Add state circles
    Object.entries(stateData).forEach(([state, data]) => {
      const { count, totalWqi, stations } = data
      const avgWqi = totalWqi / count

      // Use predefined positions or fallback to center
      const position = INDIAN_STATES[state] || { x: 400, y: 400 }

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circle.setAttribute("cx", position.x.toString())
      circle.setAttribute("cy", position.y.toString())
      circle.setAttribute("r", Math.min(30, Math.max(15, count * 5)).toString())
      circle.setAttribute("fill", getWQIColor(avgWqi))
      circle.setAttribute("stroke", "#fff")
      circle.setAttribute("stroke-width", "2")

      // Add tooltip on hover
      circle.setAttribute("data-state", state)
      circle.setAttribute("data-wqi", avgWqi.toFixed(1))
      circle.setAttribute("class", "state-circle")

      // Add event listeners
      circle.addEventListener("mouseover", () => {
        const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "g")
        tooltip.setAttribute("id", "tooltip")

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        rect.setAttribute("x", (position.x + 20).toString())
        rect.setAttribute("y", (position.y - 40).toString())
        rect.setAttribute("width", "150")
        rect.setAttribute("height", "80")
        rect.setAttribute("rx", "5")
        rect.setAttribute("fill", "white")
        rect.setAttribute("stroke", "#ced4da")

        const stateName = document.createElementNS("http://www.w3.org/2000/svg", "text")
        stateName.setAttribute("x", (position.x + 30).toString())
        stateName.setAttribute("y", (position.y - 20).toString())
        stateName.setAttribute("font-size", "12")
        stateName.textContent = state

        const wqiText = document.createElementNS("http://www.w3.org/2000/svg", "text")
        wqiText.setAttribute("x", (position.x + 30).toString())
        wqiText.setAttribute("y", position.y.toString())
        wqiText.setAttribute("font-size", "12")
        wqiText.textContent = `Avg WQI: ${avgWqi.toFixed(1)} (${getWQICategory(avgWqi)})`

        const stationsText = document.createElementNS("http://www.w3.org/2000/svg", "text")
        stationsText.setAttribute("x", (position.x + 30).toString())
        stationsText.setAttribute("y", (position.y + 20).toString())
        stationsText.setAttribute("font-size", "12")
        stationsText.textContent = `Stations: ${count}`

        tooltip.appendChild(rect)
        tooltip.appendChild(stateName)
        tooltip.appendChild(wqiText)
        tooltip.appendChild(stationsText)
        svg.appendChild(tooltip)
      })

      circle.addEventListener("mouseout", () => {
        const tooltip = document.getElementById("tooltip")
        if (tooltip) {
          tooltip.remove()
        }
      })

      svg.appendChild(circle)

      // Add state label
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", position.x.toString())
      text.setAttribute("y", position.y.toString())
      text.setAttribute("text-anchor", "middle")
      text.setAttribute("font-size", "10")
      text.setAttribute("font-weight", "bold")
      text.setAttribute("fill", getWQITextColor(avgWqi))
      text.textContent = state.substring(0, 2)
      svg.appendChild(text)
    })

    // Add legend
    const legendX = 50
    const legendY = 50

    const legendTitle = document.createElementNS("http://www.w3.org/2000/svg", "text")
    legendTitle.setAttribute("x", legendX.toString())
    legendTitle.setAttribute("y", legendY.toString())
    legendTitle.setAttribute("font-size", "14")
    legendTitle.setAttribute("font-weight", "bold")
    legendTitle.textContent = "Water Quality Index"
    svg.appendChild(legendTitle)

    const legendItems = [
      { label: "Excellent (>95)", color: "#10b981", category: "Excellent" },
      { label: "Good (80-95)", color: "#34d399", category: "Good" },
      { label: "Fair (65-80)", color: "#fbbf24", category: "Fair" },
      { label: "Marginal (45-65)", color: "#f97316", category: "Marginal" },
      { label: "Poor (<45)", color: "#ef4444", category: "Poor" },
    ]

    legendItems.forEach((item, index) => {
      const y = legendY + 25 + index * 20

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      rect.setAttribute("x", legendX.toString())
      rect.setAttribute("y", y.toString())
      rect.setAttribute("width", "15")
      rect.setAttribute("height", "15")
      rect.setAttribute("fill", item.color)
      svg.appendChild(rect)

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", (legendX + 25).toString())
      text.setAttribute("y", (y + 12).toString())
      text.setAttribute("font-size", "12")
      text.textContent = item.label
      svg.appendChild(text)
    })

    container.appendChild(svg)
  } catch (error) {
    console.error("Error creating map:", error)
    container.innerHTML = '<div class="p-4 text-red-500">Error creating map. Please try again.</div>'
  }
}
