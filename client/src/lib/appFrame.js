function syncAppFrame() {
  const viewport = window.visualViewport
  const height = viewport?.height ?? window.innerHeight
  const top = viewport?.offsetTop ?? 0
  document.documentElement.style.setProperty("--app-height", `${Math.round(height)}px`)
  document.documentElement.style.setProperty("--app-top", `${Math.round(top)}px`)
}
export function startAppFrame() {
  if (typeof window === "undefined") {
    return
  }
  syncAppFrame()
  window.visualViewport?.addEventListener("resize", syncAppFrame)
  window.visualViewport?.addEventListener("scroll", syncAppFrame)
  window.addEventListener("resize", syncAppFrame)
  window.addEventListener("orientationchange", syncAppFrame)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      syncAppFrame()
    }
  })
}
