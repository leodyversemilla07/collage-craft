import { useState, useCallback } from "react"
import { toast } from "sonner"

import type { CollageLayout, CollageSettings } from "@/types"
import { exportCollagePng } from "@/lib/canvas-renderer"

export function useCanvasExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportCollage = useCallback(
    async (
      imageMap: Map<string, HTMLImageElement>,
      layout: CollageLayout,
      settings: CollageSettings,
      isDark: boolean
    ) => {
      setIsExporting(true)
      const toastId = toast.loading("Preparing PNG export...")

      try {
        await exportCollagePng(imageMap, layout, settings, isDark)
        toast.success("Collage exported.", {
          id: toastId,
          description: "Your PNG download should start automatically.",
        })
      } catch (error) {
        toast.error("Export failed.", {
          id: toastId,
          description:
            error instanceof Error
              ? error.message
              : "Something went wrong while generating the PNG.",
        })
        throw error
      } finally {
        setIsExporting(false)
      }
    },
    []
  )

  return { isExporting, exportCollage }
}
