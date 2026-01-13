"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, AlertCircle, CheckCircle2, Download } from "lucide-react"
import { calculateWQI } from "@/lib/wqi-calculator"
import type { WaterParameters } from "@/lib/wqi-calculator"
import type { GeoData } from "@/lib/types"

interface FileUploadProps {
  onDataProcessed: (data: {
    stations: GeoData[]
    parameters: Record<string, WaterParameters>
  }) => void
}

export default function FileUpload({ onDataProcessed }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Check file type
      if (!file.name.endsWith(".csv")) {
        throw new Error("Please upload a CSV file")
      }

      // Read file
      const text = await readFileAsText(file)

      if (!text || text.trim() === "") {
        throw new Error("The CSV file is empty")
      }

      // Parse CSV
      const { stations, parameters } = parseCSV(text)

      if (stations.length === 0) {
        throw new Error("No valid data found in the CSV file")
      }

      // Process data
      onDataProcessed({ stations, parameters })

      setSuccess(`Successfully processed ${stations.length} stations from ${file.name}`)

      // Save to localStorage
      localStorage.setItem("waterQualityData", JSON.stringify({ stations, parameters }))
    } catch (err) {
      console.error("File upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to process file")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve((e.target?.result as string) || "")
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  const parseCSV = (text: string): { stations: GeoData[]; parameters: Record<string, WaterParameters> } => {
    try {
      // Split by newlines, handling different line endings
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "")

      if (lines.length < 2) {
        throw new Error("CSV file must contain at least a header row and one data row")
      }

      // Parse header - handle both comma and semicolon delimiters
      const delimiter = lines[0].includes(",") ? "," : ";"
      const header = lines[0].split(delimiter).map((h) => h.trim().toLowerCase())

      // Define column mappings to handle different column names
      const columnMappings: Record<string, string[]> = {
        station: ["station", "station_name", "station_id", "name", "id"],
        location: ["location", "loc", "place", "water_body", "river", "lake"],
        state: ["state", "province", "region", "area"],
        latitude: ["latitude", "lat", "y"],
        longitude: ["longitude", "long", "lon", "lng", "x"],
        do: ["do", "dissolved_oxygen", "oxygen"],
        ph: ["ph", "ph_value"],
        bod: ["bod", "biochemical_oxygen_demand"],
        nitrates: ["nitrates", "nitrate", "no3", "nitrogen"],
        coliform: ["coliform", "fecal_coliform", "bacteria"],
        conductivity: ["conductivity", "cond", "ec"],
        temperature: ["temperature", "temp", "water_temperature"],
        turbidity: ["turbidity", "turb", "clarity"],
        phosphates: ["phosphates", "phosphate", "po4", "phosphorus"],
      }

      // Map actual column names to standard names
      const columnMap: Record<string, string> = {}

      for (const [standardName, aliases] of Object.entries(columnMappings)) {
        const foundAlias = aliases.find((alias) => header.includes(alias))
        if (foundAlias) {
          columnMap[standardName] = foundAlias
        }
      }

      // Check for minimum required columns
      const minimumRequiredColumns = ["station", "do", "ph"]
      const missingMinimumColumns = minimumRequiredColumns.filter((col) => !columnMap[col])

      if (missingMinimumColumns.length > 0) {
        throw new Error(`CSV file is missing minimum required columns: ${missingMinimumColumns.join(", ")}. 
          At minimum, your CSV must include columns for station name, dissolved oxygen (DO), and pH.`)
      }

      const stations: GeoData[] = []
      const parameters: Record<string, WaterParameters> = {}

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Split the line by the delimiter and handle quoted values
        const values = line.split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ""))

        if (values.length !== header.length) {
          console.warn(
            `Skipping line ${i + 1}: column count mismatch (expected ${header.length}, got ${values.length})`,
          )
          continue
        }

        // Create a record from the header and values
        const record: Record<string, string> = {}
        header.forEach((h, index) => {
          record[h] = values[index] || ""
        })

        // Get values using the column map, with fallbacks
        const getValue = (standardName: string, defaultValue = ""): string => {
          const columnName = columnMap[standardName]
          return columnName ? record[columnName] || defaultValue : defaultValue
        }

        // Get station name (required)
        const stationName = getValue("station")
        if (!stationName) {
          console.warn(`Skipping line ${i + 1}: missing station name`)
          continue
        }

        // Get location with fallback to station name
        const location = getValue("location", stationName)

        // Get state with fallback
        const state = getValue("state", "Unknown")

        // Parse numeric values with fallbacks
        const safeParseFloat = (standardName: string, defaultValue: number): number => {
          const value = getValue(standardName, "")
          const parsed = Number.parseFloat(value)
          return isNaN(parsed) ? defaultValue : parsed
        }

        // Get coordinates with fallbacks
        const latitude = safeParseFloat("latitude", 20.5937) // Default to center of India
        const longitude = safeParseFloat("longitude", 78.9629)

        // Extract water parameters with safe parsing
        const waterParams: Partial<WaterParameters> = {
          do: safeParseFloat("do", 7.5),
          ph: safeParseFloat("ph", 7.2),
          bod: safeParseFloat("bod", 2.5),
          nitrates: safeParseFloat("nitrates", 15),
          conductivity: safeParseFloat("conductivity", 350),
          coliform: safeParseFloat("coliform", 500),
          temperature: safeParseFloat("temperature", 25),
          turbidity: safeParseFloat("turbidity", 10),
          phosphates: safeParseFloat("phosphates", 0.5),
        }

        // Calculate WQI
        const wqi = calculateWQI(waterParams)

        // Create station record
        const station: GeoData = {
          station: stationName,
          location,
          state,
          latitude,
          longitude,
          wqi,
        }

        stations.push(station)
        parameters[stationName] = waterParams as WaterParameters
      }

      if (stations.length === 0) {
        throw new Error("No valid data rows found in CSV file")
      }

      return { stations, parameters }
    } catch (error) {
      console.error("CSV parsing error:", error)
      throw error instanceof Error ? error : new Error("Failed to parse CSV file. Please check the format.")
    }
  }

  const handleLoadSaved = () => {
    try {
      const savedData = localStorage.getItem("waterQualityData")
      if (!savedData) {
        setError("No saved data found")
        return
      }

      const { stations, parameters } = JSON.parse(savedData)

      if (!Array.isArray(stations) || stations.length === 0) {
        setError("Invalid saved data format")
        return
      }

      onDataProcessed({ stations, parameters })
      setSuccess(`Loaded ${stations.length} stations from saved data`)
    } catch (err) {
      console.error("Load saved data error:", err)
      setError("Failed to load saved data")
    }
  }

  // Sample data for demonstration
  const handleLoadSampleData = () => {
    try {
      const sampleStations: GeoData[] = [
        {
          station: "Sample Station 1",
          location: "Ganga River",
          state: "Uttar Pradesh",
          latitude: 28.6139,
          longitude: 77.209,
          wqi: 72.5,
        },
        {
          station: "Sample Station 2",
          location: "Yamuna River",
          state: "Delhi",
          latitude: 19.076,
          longitude: 72.8777,
          wqi: 68.3,
        },
        {
          station: "Sample Station 3",
          location: "Cauvery River",
          state: "Karnataka",
          latitude: 12.9716,
          longitude: 77.5946,
          wqi: 65.7,
        },
      ]

      const sampleParameters: Record<string, WaterParameters> = {
        "Sample Station 1": {
          do: 7.2,
          ph: 7.8,
          bod: 2.5,
          nitrates: 15,
          conductivity: 350,
          coliform: 500,
          temperature: 25,
          turbidity: 10,
          phosphates: 0.5,
        },
        "Sample Station 2": {
          do: 6.8,
          ph: 7.6,
          bod: 2.8,
          nitrates: 18,
          conductivity: 380,
          coliform: 600,
          temperature: 26,
          turbidity: 12,
          phosphates: 0.6,
        },
        "Sample Station 3": {
          do: 6.5,
          ph: 7.5,
          bod: 3.0,
          nitrates: 20,
          conductivity: 400,
          coliform: 700,
          temperature: 27,
          turbidity: 15,
          phosphates: 0.7,
        },
      }

      onDataProcessed({ stations: sampleStations, parameters: sampleParameters })
      setSuccess(`Loaded ${sampleStations.length} sample stations`)

      // Save to localStorage
      localStorage.setItem(
        "waterQualityData",
        JSON.stringify({
          stations: sampleStations,
          parameters: sampleParameters,
        }),
      )
    } catch (err) {
      console.error("Load sample data error:", err)
      setError("Failed to load sample data")
    }
  }

  const downloadSampleCSV = () => {
    const sampleCSV = `station,location,state,latitude,longitude,do,ph,bod,nitrates,coliform,conductivity,temperature,turbidity,phosphates
Sample Station 1,Ganga River,Uttar Pradesh,28.6139,77.209,7.2,7.8,2.5,15,500,350,25,10,0.5
Sample Station 2,Yamuna River,Delhi,19.076,72.8777,6.8,7.6,2.8,18,600,380,26,12,0.6
Sample Station 3,Cauvery River,Karnataka,12.9716,77.5946,6.5,7.5,3.0,20,700,400,27,15,0.7`

    const blob = new Blob([sampleCSV], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "water_quality_sample.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Water Quality Data</CardTitle>
        <CardDescription>Upload a CSV file with water quality parameters to visualize and analyze</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload a CSV file with water quality parameters
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="mb-2">
            {isUploading ? "Uploading..." : "Select CSV File"}
          </Button>
          <p className="text-xs text-gray-400 mt-2">Minimum required columns: station, do, ph</p>
          <Button variant="link" size="sm" onClick={downloadSampleCSV} className="mt-2 text-xs flex items-center">
            <Download className="h-3 w-3 mr-1" />
            Download Sample CSV
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 justify-between">
          <Button variant="outline" onClick={handleLoadSaved}>
            Load Saved Data
          </Button>
          <Button variant="outline" onClick={handleLoadSampleData}>
            Load Sample Data
          </Button>
          <Button variant="outline" onClick={() => localStorage.removeItem("waterQualityData")}>
            Clear Saved Data
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
            <AlertTitle className="text-green-700 dark:text-green-400">Success</AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <h3 className="text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">CSV Format Guide</h3>
          <p className="text-xs mb-2 text-gray-700 dark:text-gray-300">
            Your CSV file should include the following columns (only station, do, and ph are required):
          </p>
          <ul className="text-xs list-disc pl-5 mb-3 text-gray-700 dark:text-gray-300">
            <li>
              <strong>station</strong>: Name or ID of the monitoring station
            </li>
            <li>
              <strong>location</strong>: Water body name (river, lake, etc.)
            </li>
            <li>
              <strong>state</strong>: State or region
            </li>
            <li>
              <strong>latitude</strong>: Latitude coordinate
            </li>
            <li>
              <strong>longitude</strong>: Longitude coordinate
            </li>
            <li>
              <strong>do</strong>: Dissolved Oxygen (mg/L)
            </li>
            <li>
              <strong>ph</strong>: pH value
            </li>
            <li>
              <strong>bod</strong>: Biochemical Oxygen Demand (mg/L)
            </li>
            <li>
              <strong>nitrates</strong>: Nitrates (mg/L)
            </li>
            <li>
              <strong>coliform</strong>: Fecal Coliform (MPN/100ml)
            </li>
            <li>
              <strong>conductivity</strong>: Conductivity (μS/cm)
            </li>
            <li>
              <strong>temperature</strong>: Water Temperature (°C)
            </li>
            <li>
              <strong>turbidity</strong>: Turbidity (NTU)
            </li>
            <li>
              <strong>phosphates</strong>: Phosphates (mg/L)
            </li>
          </ul>
          <p className="text-xs mb-2 text-gray-700 dark:text-gray-300">
            The system will recognize alternative column names and provide default values for missing data.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
