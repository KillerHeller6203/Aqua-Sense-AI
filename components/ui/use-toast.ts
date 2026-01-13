"use client"

// Simplified version of the toast hook
import { useState } from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...props, id }])

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  return { toast, toasts }
}

// Simple implementation for direct import
export const toast = (props: ToastProps) => {
  // Create a toast element
  const toastElement = document.createElement("div")
  toastElement.className = `fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
    props.variant === "destructive" ? "bg-red-600 text-white" : "bg-slate-800 text-white"
  }`

  // Add title if provided
  if (props.title) {
    const titleElement = document.createElement("div")
    titleElement.className = "font-bold"
    titleElement.textContent = props.title
    toastElement.appendChild(titleElement)
  }

  // Add description if provided
  if (props.description) {
    const descElement = document.createElement("div")
    descElement.className = "text-sm"
    descElement.textContent = props.description
    toastElement.appendChild(descElement)
  }

  // Add to document
  document.body.appendChild(toastElement)

  // Remove after 5 seconds
  setTimeout(() => {
    toastElement.classList.add("opacity-0", "transition-opacity")
    setTimeout(() => {
      document.body.removeChild(toastElement)
    }, 300)
  }, 5000)
}
