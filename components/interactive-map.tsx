"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { getWQIColor, getWQICategory } from "@/lib/wqi-calculator"
import type { GeoData } from "@/lib/types"

interface InteractiveMapProps {
  data: GeoData[]
}

export default function InteractiveMap({ data }: InteractiveMapProps) {
  const [selectedState, setSelectedState] = useState<string>("all")
  const [wqiRange, setWqiRange] = useState<[number, number]>([0, 100])
  const [showLabels, setShowLabels] = useState<boolean>(true)
  const [mapType, setMapType] = useState<string>("standard")
  const [mounted, setMounted] = useState<boolean>(false)
  const [mapLoaded, setMapLoaded] = useState<boolean>(false)
  const [leafletError, setLeafletError] = useState<boolean>(false)
  const [mapInitialized, setMapInitialized] = useState<boolean>(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const markers = useRef<any[]>([])
  const L = useRef<any>(null)

  // Get unique states
  const states = [...new Set(data.map((item) => item.state))]

  // Only render on client side
  useEffect(() => {
    setMounted(true)
    return () => {
      // Proper cleanup
      if (leafletMap.current) {
        try {
          leafletMap.current.remove()
          leafletMap.current = null
        } catch (e) {
          console.error("Error removing map:", e)
        }
      }
      markers.current = []
    }
  }, [])

  // Load Leaflet dynamically
  useEffect(() => {
    if (!mounted) return

    const loadLeaflet = async () => {
      try {
        // Dynamic import with error handling
        const leaflet = await import("leaflet").catch((err) => {
          console.error("Failed to load Leaflet:", err)
          setLeafletError(true)
          return null
        })

        if (!leaflet) return

        L.current = leaflet
        setMapLoaded(true)
      } catch (error) {
        console.error("Failed to load Leaflet:", error)
        setLeafletError(true)
      }
    }

    loadLeaflet()
  }, [mounted])

  // Initialize map with a delay to ensure DOM is ready
  useEffect(() => {
    if (!mapRef.current || !mounted || !mapLoaded || !L.current || leafletError || mapInitialized) return

    // Use a timeout to ensure the DOM is fully rendered
    const initTimer = setTimeout(() => {
      initializeMap()
    }, 1000)

    return () => {
      clearTimeout(initTimer)
    }
  }, [mounted, mapLoaded, leafletError, mapInitialized])

  // Initialize the map
  const initializeMap = () => {
    if (!mapRef.current || !L.current) return

    try {
      // Ensure we have a clean start
      if (leafletMap.current) {
        try {
          leafletMap.current.remove()
        } catch (e) {
          console.error("Error removing existing map:", e)
        }
        leafletMap.current = null
      }

      // Check if container has dimensions
      const container = mapRef.current
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        console.warn("Map container has zero dimensions, delaying initialization")
        return
      }

      // Fix icon paths
      delete L.current.Icon.Default.prototype._getIconUrl
      L.current.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      })

      // Create map
      leafletMap.current = L.current
        .map(mapRef.current, {
          preferCanvas: true,
          renderer: L.current.canvas(),
          zoomControl: true,
          attributionControl: false,
          fadeAnimation: false,
          zoomAnimation: false,
          markerZoomAnimation: false,
        })
        .setView([20.5937, 78.9629], 5)

      // Add tile layer based on selected map type
      if (mapType === "satellite") {
        L.current
          .tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Esri",
            maxZoom: 8,
            noWrap: true,
          })
          .addTo(leafletMap.current)
      } else {
        L.current
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "OSM",
            maxZoom: 8,
            noWrap: true,
          })
          .addTo(leafletMap.current)
      }

      // Force a resize after a delay to ensure the map renders correctly
      setTimeout(() => {
        if (leafletMap.current) {
          leafletMap.current.invalidateSize()
          updateMarkers()
          setMapInitialized(true)
        }
      }, 500)
    } catch (error) {
      console.error("Error initializing map:", error)
      setLeafletError(true)
    }
  }

  // Update map type
  useEffect(() => {
    if (!leafletMap.current || !mounted || !L.current || leafletError || !mapInitialized) return

    try {
      // Remove existing tile layers
      leafletMap.current.eachLayer((layer: any) => {
        if (layer instanceof L.current.TileLayer) {
          leafletMap.current.removeLayer(layer)
        }
      })

      // Add new tile layer based on selected map type
      if (mapType === "satellite") {
        L.current
          .tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Esri",
            maxZoom: 8,
            noWrap: true,
          })
          .addTo(leafletMap.current)
      } else {
        L.current
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "OSM",
            maxZoom: 8,
            noWrap: true,
          })
          .addTo(leafletMap.current)
      }
    } catch (error) {
      console.error("Error updating map type:", error)
    }
  }, [mapType, mounted, leafletError, mapInitialized])

  // Update markers when filters change
  useEffect(() => {
    if (!leafletMap.current || !mounted || !L.current || leafletError || !mapInitialized) return

    // Use a small delay to avoid race conditions
    const markersTimer = setTimeout(() => {
      updateMarkers()
    }, 100)

    return () => {
      clearTimeout(markersTimer)
    }
  }, [selectedState, wqiRange, showLabels, data, mounted, leafletError, mapInitialized])

  // Function to update markers
  const updateMarkers = () => {
    if (!L.current || !leafletMap.current || !mapInitialized) return

    try {
      // Clear existing markers
      markers.current.forEach((marker) => {
        if (leafletMap.current && marker) {
          try {
            leafletMap.current.removeLayer(marker)
          } catch (e) {
            console.error("Error removing marker:", e)
          }
        }
      })
      markers.current = []

      // Filter data
      const filteredData = data.filter((item) => {
        const stateMatch = selectedState === "all" || item.state === selectedState
        const wqiMatch = item.wqi >= wqiRange[0] && item.wqi <= wqiRange[1]
        return stateMatch && wqiMatch
      })

      // Limit the number of markers to improve performance
      const maxMarkers = 50
      const dataToShow = filteredData.length > maxMarkers ? filteredData.slice(0, maxMarkers) : filteredData

      // Add markers for filtered data
      dataToShow.forEach((item) => {
        // Create custom icon
        const icon = L.current.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color: ${getWQIColor(item.wqi)}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        // Create marker
        try {
          const marker = L.current
            .marker([item.latitude, item.longitude], { icon })
            .addTo(leafletMap.current)
            .bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="font-weight: bold; margin-bottom: 5px;">${item.station}</h3>
                <p style="margin: 2px 0;">${item.location}, ${item.state}</p>
                <p style="margin: 2px 0;">WQI: <strong>${item.wqi.toFixed(1)}</strong></p>
                <p style="margin: 2px 0;">Category: <span style="color: ${getWQIColor(item.wqi)}; font-weight: bold;">${getWQICategory(item.wqi)}</span></p>
              </div>
            `)

          markers.current.push(marker)
        } catch (e) {
          console.error("Error adding marker:", e)
        }

        // Add labels if enabled (but limit to improve performance)
        if (showLabels && dataToShow.length <= 20) {
          try {
            const label = L.current
              .tooltip({
                permanent: true,
                direction: "top",
                className: "station-label",
              })
              .setContent(item.station)
              .setLatLng([item.latitude, item.longitude])

            leafletMap.current.addLayer(label)
            markers.current.push(label)
          } catch (e) {
            console.error("Error adding label:", e)
          }
        }
      })

      // Fit bounds if there are markers
      if (markers.current.length > 0) {
        try {
          const group = L.current.featureGroup(markers.current.filter((m) => m instanceof L.current.Marker))
          if (group.getBounds().isValid()) {
            leafletMap.current.fitBounds(group.getBounds(), { padding: [50, 50] })
          }
        } catch (e) {
          console.error("Error fitting bounds:", e)
        }
      }
    } catch (error) {
      console.error("Error updating markers:", error)
    }
  }

  // Render loading state if not mounted
  if (!mounted) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-md flex items-center justify-center">
        Loading interactive map...
      </div>
    )
  }

  // Render error state if Leaflet failed to load
  if (leafletError) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Interactive Water Quality Map</CardTitle>
          <CardDescription>Explore water quality data across different locations</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="h-[500px] bg-gray-100 rounded-md flex flex-col items-center justify-center">
            <div className="text-red-500 mb-4">Failed to load map</div>
            <p className="text-gray-500 max-w-md text-center">
              There was an error loading the interactive map. Please try refreshing the page or check your internet
              connection.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card suppressHydrationWarning>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>Interactive Water Quality Map</CardTitle>
        <CardDescription>Explore water quality data across different locations</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">State/Region</label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="mt-1">
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

          <div>
            <label className="text-sm font-medium">Map Type</label>
            <Select value={mapType} onValueChange={setMapType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select map type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1 sm:col-span-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">WQI Range</span>
              <span className="text-sm text-muted-foreground">
                {wqiRange[0]} - {wqiRange[1]}
              </span>
            </div>
            <Slider
              value={wqiRange}
              min={0}
              max={100}
              step={1}
              minStepsBetweenThumbs={10}
              onValueChange={(value) => setWqiRange([value[0], value[1]])}
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-labels"
            checked={showLabels}
            onCheckedChange={(checked) => setShowLabels(checked as boolean)}
          />
          <Label htmlFor="show-labels">Show station labels</Label>
        </div>

        {/* Map container */}
        <div
          id="map-container"
          className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-md border bg-gray-100"
          style={{ minHeight: "300px" }}
        >
          <div ref={mapRef} className="absolute inset-0 w-full h-full z-10"></div>
          {(!mapLoaded || !mapInitialized) && !leafletError && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-100 bg-opacity-80">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {["Excellent", "Good", "Fair", "Marginal", "Poor"].map((category, index) => {
            const wqi = index === 0 ? 95 : index === 1 ? 85 : index === 2 ? 70 : index === 3 ? 55 : 40
            return (
              <div key={category} className="flex items-center space-x-1">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getWQIColor(wqi) }}></div>
                <span className="text-xs">{category}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
