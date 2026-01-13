import { NextResponse } from "next/server"
import { generatePredictions } from "@/lib/arima-model"

export async function GET(request: Request) {
  try {
    // Get the number of years to predict from the query string
    const { searchParams } = new URL(request.url)
    const years = Number.parseInt(searchParams.get("years") || "15", 10)

    // Generate predictions using the ARIMA model
    const predictions = await generatePredictions(years)

    // Return the predictions as JSON
    return NextResponse.json(predictions)
  } catch (error) {
    console.error("Error generating predictions:", error)
    return NextResponse.json({ error: "Failed to generate predictions" }, { status: 500 })
  }
}
