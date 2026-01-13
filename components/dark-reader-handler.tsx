"use client"

import { useEffect } from "react"

export default function DarkReaderHandler() {
  useEffect(() => {
    // Function to remove Dark Reader styles
    const removeDarkReaderStyles = () => {
      try {
        // Disable Dark Reader via attributes
        document.documentElement.setAttribute("data-darkreader-mode", "off")
        document.documentElement.setAttribute("data-darkreader-scheme", "off")

        // Remove all Dark Reader styles
        const darkReaderStyles = document.querySelectorAll(
          "style.darkreader, style.darkreader--sync, style.darkreader--fallback, style[class*='darkreader']",
        )
        darkReaderStyles.forEach((style) => {
          if (style && style.parentNode) {
            style.parentNode.removeChild(style)
          }
        })

        // Also remove any Dark Reader link elements
        const darkReaderLinks = document.querySelectorAll("link[href*='darkreader']")
        darkReaderLinks.forEach((link) => {
          if (link && link.parentNode) {
            link.parentNode.removeChild(link)
          }
        })
      } catch (e) {
        console.error("Error removing Dark Reader styles:", e)
      }
    }

    // Run immediately
    removeDarkReaderStyles()

    // Run again after a short delay
    const initialTimeoutId = setTimeout(removeDarkReaderStyles, 100)

    // Set up a MutationObserver to catch any Dark Reader styles that might be added later
    let observer: MutationObserver | null = null
    try {
      observer = new MutationObserver((mutations) => {
        let needsCleanup = false

        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
              if (
                (node.nodeName === "STYLE" &&
                  ((node as Element).className?.includes?.("darkreader") ||
                    (node as Element).getAttribute?.("class")?.includes("darkreader"))) ||
                (node.nodeName === "LINK" &&
                  (node as Element).getAttribute?.("rel") === "stylesheet" &&
                  (node as Element).getAttribute?.("href")?.includes("darkreader"))
              ) {
                if (node.parentNode) {
                  node.parentNode.removeChild(node)
                }
                needsCleanup = true
              }
            })
          }
        })

        // Additional cleanup after mutations if needed
        if (needsCleanup) {
          removeDarkReaderStyles()
        }
      })

      // Start observing the document with the configured parameters
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      })
    } catch (e) {
      console.error("Error setting up MutationObserver:", e)
    }

    // Set up an interval to periodically check for and remove Dark Reader styles
    const intervalId = setInterval(removeDarkReaderStyles, 1000)

    // Clean up observer and intervals on component unmount
    return () => {
      clearTimeout(initialTimeoutId)
      clearInterval(intervalId)
      if (observer) {
        observer.disconnect()
      }
    }
  }, [])

  return null
}
