"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { predictStateWqi } from "@/lib/data-service"

// Complete list of Indian states and union territories
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
]

// Use fixed years to avoid hydration mismatches
const CURRENT_YEAR = 2023
const MAX_YEAR = CURRENT_YEAR + 15

export default function StatePredictionForm() {
  const [state, setState] = useState<string>("")
  const [year, setYear] = useState<string>(CURRENT_YEAR.toString())
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<{ wqi: number; category: string; confidence: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!state) {
      setError("Please select a state")
      return
    }

    const yearNum = Number.parseInt(year)
    if (isNaN(yearNum) || yearNum < CURRENT_YEAR || yearNum > MAX_YEAR) {
      setError(`Please enter a year between ${CURRENT_YEAR} and ${MAX_YEAR}`)
      return
    }

    setError(null)
    setLoading(true)

    try {
      const prediction = await predictStateWqi(state, yearNum)
      setResult(prediction)
    } catch (err) {
      setError("Failed to generate prediction. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="w-full h-[300px] bg-gray-100 rounded-md flex items-center justify-center">
        Loading prediction form...
      </div>
    )
  }

  return (
    <Card suppressHydrationWarning>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>Predict Water Quality for Indian States</CardTitle>
        <CardDescription>Select a state and year to predict the Water Quality Index</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="state" className="text-sm font-medium">
                State
              </label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {INDIAN_STATES.map((stateName) => (
                    <SelectItem key={stateName} value={stateName}>
                      {stateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="year" className="text-sm font-medium">
                Year ({CURRENT_YEAR}-{MAX_YEAR})
              </label>
              <Input
                id="year"
                type="number"
                min={CURRENT_YEAR}
                max={MAX_YEAR}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Prediction...
              </>
            ) : (
              "Predict Water Quality"
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium mb-2">Prediction Result</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Predicted WQI for {state} in {year}
                </p>
                <p className="text-3xl font-bold">{result.wqi.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Water Quality Category</p>
                <p className="text-xl font-semibold" style={{ color: getCategoryColor(result.category) }}>
                  {result.category}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Confidence Level: {result.confidence}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${result.confidence}%` }}></div>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Note: This prediction is based on historical data and ARIMA(5,1,0) model. Actual water quality may vary
              due to unforeseen factors.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "Excellent":
      return "#10b981"
    case "Good":
      return "#34d399"
    case "Fair":
      return "#fbbf24"
    case "Marginal":
      return "#f97316"
    case "Poor":
      return "#ef4444"
    default:
      return "#6b7280"
  }
}
