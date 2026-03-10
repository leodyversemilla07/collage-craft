import { useRef, useEffect } from "react"
import type { Photo, CollageLayout, CollageSettings } from "@/types"
import { renderCollage } from "@/lib/canvas-renderer"
import { EmptyState } from "./empty-state"

// Preview renders at this fraction of full canvas size for speed.
// Export still uses full (2×) resolution.
const PREVIEW_SCALE = 0.5

interface CollageCanvasProps {
  photos: Photo[]
  layout: CollageLayout | null
  settings: CollageSettings
  imageMap: Map<string, HTMLImageElement>
  isDark: boolean
}

export function CollageCanvas({
  photos,
  layout,
  settings,
  imageMap,
  isDark,
}: CollageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !layout || imageMap.size === 0) return

    // Scale layout down for preview rendering
    const scaledLayout: CollageLayout = {
      canvasWidth: Math.round(layout.canvasWidth * PREVIEW_SCALE),
      canvasHeight: Math.round(layout.canvasHeight * PREVIEW_SCALE),
      tiles: layout.tiles.map((t) => ({
        ...t,
        x: t.x * PREVIEW_SCALE,
        y: t.y * PREVIEW_SCALE,
        width: t.width * PREVIEW_SCALE,
        height: t.height * PREVIEW_SCALE,
      })),
    }

    renderCollage(canvas, imageMap, scaledLayout, settings, isDark)
  }, [layout, settings, imageMap, isDark])

  if (!layout || photos.length === 0) {
    return <EmptyState />
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: "100%",
        maxHeight: "100%",
        width: "auto",
        height: "auto",
      }}
      className="rounded-lg shadow-2xl"
    />
  )
}
