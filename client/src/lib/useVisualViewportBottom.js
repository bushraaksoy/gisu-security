import { useEffect } from "react"

/** Keeps --vv-bottom in sync so fixed chrome tracks the visible screen on iOS Safari. */
export function useVisualViewportBottom() {
  useEffect(() => {
    const root = document.documentElement
    function update() {
      const vv = window.visualViewport
      if (!vv) {
        root.style.setProperty("--vv-bottom", "0px")
        return
      }
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      root.style.setProperty("--vv-bottom", `${Math.round(offset)}px`)
    }
    update()
    const vv = window.visualViewport
    vv?.addEventListener("resize", update)
    vv?.addEventListener("scroll", update)
    window.addEventListener("resize", update)
    window.addEventListener("orientationchange", update)
    return () => {
      vv?.removeEventListener("resize", update)
      vv?.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
      window.removeEventListener("orientationchange", update)
      root.style.removeProperty("--vv-bottom")
    }
  }, [])
}
