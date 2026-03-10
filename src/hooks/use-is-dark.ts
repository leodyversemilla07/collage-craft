import { useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"

/**
 * Returns true when the active (resolved) theme is dark.
 * Handles the "system" setting by listening to the OS preference.
 */
export function useIsDark(): boolean {
  const { theme } = useTheme()

  const [systemDark, setSystemDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  )

  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  if (theme === "dark") return true
  if (theme === "light") return false
  return systemDark
}
