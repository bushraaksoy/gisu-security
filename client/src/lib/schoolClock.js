import { useEffect, useState } from "react"
import { queryClient } from "@/lib/queryClient"
import { dayPart } from "@/lib/schoolDay"
let now = new Date()
const listeners = new Set()
let started = false
function publish() {
  const next = new Date()
  const changed = dayPart(next) !== dayPart(now)
  now = next
  if (changed) {
    listeners.forEach((listener) => listener(now))
  }
}
function refreshApp() {
  publish()
  queryClient.invalidateQueries()
  if (!("serviceWorker" in navigator)) {
    return
  }
  navigator.serviceWorker
    .getRegistration()
    .then((registration) => registration?.update())
    .catch(() => {})
}
export function startSchoolClock() {
  if (started || typeof window === "undefined") {
    return
  }
  started = true
  let last = Date.now()
  let hidden = document.visibilityState === "hidden"
  window.setInterval(() => {
    const gap = Date.now() - last
    last = Date.now()
    publish()
    if (gap > 60_000) {
      refreshApp()
    }
  }, 5000)
  document.addEventListener("visibilitychange", () => {
    const visible = document.visibilityState === "visible"
    if (visible && hidden) {
      last = Date.now()
      refreshApp()
    }
    hidden = !visible
  })
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) {
      return
    }
    last = Date.now()
    refreshApp()
  })
}
export function useNow() {
  const [value, setValue] = useState(() => now)
  useEffect(() => {
    const listener = (next) => setValue(next)
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [])
  return value
}
