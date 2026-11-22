"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    // Service workers cache HTML and break Next.js HMR in development.
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })
      return
    }

    const isSecureContext =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost"

    if (!isSecureContext) {
      return
    }

    const handleRegister = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered successfully with scope:", reg.scope)
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err)
        })
    }

    if (document.readyState === "complete") {
      handleRegister()
    } else {
      window.addEventListener("load", handleRegister)
      return () => window.removeEventListener("load", handleRegister)
    }
  }, [])

  return null
}
