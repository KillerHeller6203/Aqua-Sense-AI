export interface WaterQualityData {
  yearlyWqi: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }[]
  }
  parameters: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }[]
  }
  stats: StatsData
  geoData: GeoData[]
}

export interface StatsData {
  parameters: {
    "DO (mg/l)": number
    pH: number
    "BOD (mg/l)": number
    Conductivity: number
    "Nitrates (mg/l)": number
    "Coliform (MPN/100ml)": number
  }
  currentWqi: number
  totalSamples: number
  yearRange: string
}

export interface GeoData {
  station: string
  location: string
  state: string
  latitude: number
  longitude: number
  wqi: number
}

export interface PredictionData {
  historicalYears: string[]
  historicalValues: number[]
  predictionYears: string[]
  predictionValues: number[]
  upperCI: number[]
  lowerCI: number[]
  rmse: number
}
