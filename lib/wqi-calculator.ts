// Water Quality Index Calculator based on NSF WQI method
// This is a simplified version for demonstration purposes

export interface WaterParameters {
  do: number // Dissolved Oxygen (mg/L)
  ph: number // pH
  bod: number // Biochemical Oxygen Demand (mg/L)
  nitrates: number // Nitrates (mg/L)
  conductivity: number // Conductivity (μS/cm)
  coliform: number // Fecal Coliform (MPN/100ml)
  temperature: number // Temperature (°C)
  turbidity: number // Turbidity (NTU)
  phosphates: number // Total Phosphates (mg/L)
}

// Weight factors for each parameter (based on NSF WQI)
const weightFactors = {
  do: 0.17,
  ph: 0.11,
  bod: 0.11,
  nitrates: 0.1,
  conductivity: 0.08,
  coliform: 0.16,
  temperature: 0.1,
  turbidity: 0.08,
  phosphates: 0.09,
}

// Calculate sub-index for Dissolved Oxygen (% saturation)
function calculateDOSubIndex(do_mg_l: number, temperature: number): number {
  // Convert DO from mg/L to % saturation (simplified)
  const doSaturation = (do_mg_l / (14.652 - 0.41022 * temperature + 0.007991 * temperature * temperature)) * 100

  // DO sub-index calculation (simplified curve)
  if (doSaturation >= 100) return 100
  return doSaturation
}

// Calculate sub-index for pH
function calculatePHSubIndex(ph: number): number {
  if (ph < 2) return 0
  if (ph > 12) return 0
  if (ph >= 7 && ph <= 8.5) return 100
  if (ph < 7) return 100 - ((7 - ph) / 5) * 100
  return 100 - ((ph - 8.5) / 3.5) * 100
}

// Calculate sub-index for BOD
function calculateBODSubIndex(bod: number): number {
  if (bod > 30) return 0
  return 100 - (bod / 30) * 100
}

// Calculate sub-index for Nitrates
function calculateNitratesSubIndex(nitrates: number): number {
  if (nitrates > 100) return 0
  return 100 - (nitrates / 100) * 100
}

// Calculate sub-index for Conductivity
function calculateConductivitySubIndex(conductivity: number): number {
  if (conductivity > 2000) return 0
  return 100 - (conductivity / 2000) * 100
}

// Calculate sub-index for Fecal Coliform
function calculateColiformSubIndex(coliform: number): number {
  if (coliform > 100000) return 0
  return 100 - (Math.log10(coliform) / 5) * 100
}

// Calculate sub-index for Temperature
function calculateTemperatureSubIndex(temperature: number): number {
  if (temperature < 10 || temperature > 30) return 50
  return 100 - Math.abs(temperature - 20) * 5
}

// Calculate sub-index for Turbidity
function calculateTurbiditySubIndex(turbidity: number): number {
  if (turbidity > 100) return 0
  return 100 - turbidity
}

// Calculate sub-index for Phosphates
function calculatePhosphatesSubIndex(phosphates: number): number {
  if (phosphates > 10) return 0
  return 100 - (phosphates / 10) * 100
}

// Calculate the overall Water Quality Index
export function calculateWQI(params: Partial<WaterParameters>): number {
  // Default values for missing parameters
  const defaultParams: WaterParameters = {
    do: 7.5,
    ph: 7.2,
    bod: 2.5,
    nitrates: 15,
    conductivity: 350,
    coliform: 500,
    temperature: 25,
    turbidity: 10,
    phosphates: 0.5,
  }

  // Merge provided parameters with defaults
  const mergedParams = { ...defaultParams, ...params }

  // Calculate sub-indices
  const subIndices = {
    do: calculateDOSubIndex(mergedParams.do, mergedParams.temperature),
    ph: calculatePHSubIndex(mergedParams.ph),
    bod: calculateBODSubIndex(mergedParams.bod),
    nitrates: calculateNitratesSubIndex(mergedParams.nitrates),
    conductivity: calculateConductivitySubIndex(mergedParams.conductivity),
    coliform: calculateColiformSubIndex(mergedParams.coliform),
    temperature: calculateTemperatureSubIndex(mergedParams.temperature),
    turbidity: calculateTurbiditySubIndex(mergedParams.turbidity),
    phosphates: calculatePhosphatesSubIndex(mergedParams.phosphates),
  }

  // Calculate weighted sum
  let weightedSum = 0
  let totalWeight = 0

  for (const [param, subIndex] of Object.entries(subIndices)) {
    const weight = weightFactors[param as keyof typeof weightFactors]
    weightedSum += subIndex * weight
    totalWeight += weight
  }

  // Calculate final WQI
  const wqi = weightedSum / totalWeight

  // Round to 1 decimal place
  return Math.round(wqi * 10) / 10
}

// Get WQI category
export function getWQICategory(wqi: number): string {
  if (wqi >= 95) return "Excellent"
  if (wqi >= 80) return "Good"
  if (wqi >= 65) return "Fair"
  if (wqi >= 45) return "Marginal"
  return "Poor"
}

// Get color for WQI category
export function getWQIColor(wqi: number): string {
  if (wqi >= 95) return "#10b981" // emerald-500
  if (wqi >= 80) return "#34d399" // emerald-400
  if (wqi >= 65) return "#fbbf24" // amber-400
  if (wqi >= 45) return "#f97316" // orange-500
  return "#ef4444" // red-500
}

// Get text color for WQI category (for contrast)
export function getWQITextColor(wqi: number): string {
  if (wqi >= 65) return "#000000"
  return "#ffffff"
}
