import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AquaPulse - Water Quality Monitoring & Prediction",
  description: "Advanced water quality analysis and prediction platform for Indian water bodies",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Add Leaflet CSS */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" crossOrigin="" />
      </head>
      <body className={`${inter.className} bg-[#0a0e17] text-slate-200`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
