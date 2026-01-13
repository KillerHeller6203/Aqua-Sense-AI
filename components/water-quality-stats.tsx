"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculateWQI, getWQICategory, getWQIColor } from "@/lib/wqi-calculator"
import type { WaterParameters } from "@/lib/wqi-calculator"
import type { StatsData } from "@/lib/types"

interface WaterQualityStatsProps {
  data: StatsData
  userParameters?: Record<string, WaterParameters>
}

export default function WaterQualityStats({ data, userParameters = {} }: WaterQualityStatsProps) {
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [calculatedWqi, setCalculatedWqi] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use useCallback to memoize the calculation function
  const calculateStationWqi = useCallback(
    (station: string) => {
      if (!userParameters[station]) return null

      const params = userParameters[station]
      return calculateWQI({
        do: params.do,
        ph: params.ph,
        bod: params.bod,
        nitrates: params.nitrates,
        coliform: params.coliform,
        conductivity: params.conductivity || 350,
        temperature: params.temperature || 25,
        turbidity: params.turbidity || 10,
        phosphates: params.phosphates || 0.5,
      })
    },
    [userParameters],
  )

  // Only recalculate WQI when selectedStation changes
  useEffect(() => {
    if (!selectedStation) {
      setCalculatedWqi(null)
      return
    }

    const wqi = calculateStationWqi(selectedStation)
    setCalculatedWqi(wqi)
  }, [selectedStation, calculateStationWqi])

  if (!mounted) {
    return <div className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center">Loading stats...</div>
  }

  const stations = Object.keys(userParameters)

  return (
    <div className="space-y-4">
      {stations.length > 0 && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="user-data">User Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DefaultStats data={data} />
          </TabsContent>

          <TabsContent value="user-data">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="station-select" className="text-sm font-medium">
                  Select Station
                </label>
                <select
                  id="station-select"
                  className="w-full p-2 border rounded-md bg-slate-700 text-slate-200"
                  value={selectedStation || ""}
                  onChange={(e) => setSelectedStation(e.target.value || null)}
                >
                  <option value="">Select a station</option>
                  {stations.map((station) => (
                    <option key={station} value={station}>
                      {station}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStation && userParameters[selectedStation] && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(userParameters[selectedStation]).map(([key, value]) => (
                      <div key={key} className="bg-slate-800/50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-slate-300">{key}</h3>
                        <p className="text-2xl font-bold text-slate-100">
                          {typeof value === "number" ? value.toFixed(2) : value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {calculatedWqi !== null && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Calculated Water Quality</h3>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200 dark:bg-teal-900 dark:text-teal-300">
                              WQI: {calculatedWqi.toFixed(1)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-teal-600 dark:text-teal-300">
                              {getWQICategory(calculatedWqi)}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                          <div
                            style={{
                              width: `${(calculatedWqi / 100) * 100}%`,
                              backgroundColor: getWQIColor(calculatedWqi),
                            }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {stations.length === 0 && <DefaultStats data={data} />}
    </div>
  )
}

function DefaultStats({ data }: { data: StatsData }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(data.parameters).map(([key, value]) => (
          <div key={key} className="bg-slate-800/50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-slate-300">{key}</h3>
            <p className="text-2xl font-bold text-slate-100">{value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2 text-slate-100">Water Quality Classification</h3>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200 dark:bg-teal-900 dark:text-teal-300">
                Current WQI: {data.currentWqi.toFixed(1)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-teal-600 dark:text-teal-300">
                {getWQICategory(data.currentWqi)}
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
            <div
              style={{
                width: `${(data.currentWqi / 100) * 100}%`,
                backgroundColor: getWQIColor(data.currentWqi),
              }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <h3 className="text-sm font-medium text-slate-300">Total Samples</h3>
          <p className="text-xl font-bold text-slate-100">{data.totalSamples}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-300">Date Range</h3>
          <p className="text-xl font-bold text-slate-100">{data.yearRange}</p>
        </div>
      </div>
    </>
  )
}
