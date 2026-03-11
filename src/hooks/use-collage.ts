import { useState, useMemo, useCallback, useEffect } from "react"
import type {
  Photo,
  CollageLayout,
  CollageSettings,
  CollageStyle,
  CanvasPreset,
  CollageDensity,
} from "@/types"
import { DEFAULT_SETTINGS } from "@/lib/constants"
import { scorePhotos } from "@/lib/scoring"
import { generateLayout } from "@/lib/layout-engine"
import {
  applyAssignedPhotoIds,
  getTileAssignmentSignature,
  swapAssignedPhotoIds,
} from "@/lib/tile-assignments"

const STYLES: CollageStyle[] = ["grid", "magazine", "scrapbook"]

export function useCollage(rawPhotos: Photo[]) {
  const [settings, setSettings] = useState<CollageSettings>(DEFAULT_SETTINGS)
  const [seed, setSeed] = useState(1)
  const [scoredPhotos, setScoredPhotos] = useState<Photo[]>([])
  const [assignmentState, setAssignmentState] = useState<{
    signature: string
    photoIds: string[]
  }>({ signature: "", photoIds: [] })

  useEffect(() => {
    let cancelled = false
    scorePhotos(rawPhotos).then((scored) => {
      if (!cancelled) setScoredPhotos(scored)
    })
    return () => {
      cancelled = true
    }
  }, [rawPhotos])

  const baseLayout = useMemo((): CollageLayout | null => {
    if (scoredPhotos.length === 0) return null
    return generateLayout(scoredPhotos, settings, seed)
  }, [scoredPhotos, settings, seed])

  const baseSignature = useMemo(
    () => getTileAssignmentSignature(baseLayout),
    [baseLayout]
  )

  const assignedPhotoIds = useMemo(() => {
    if (assignmentState.signature === baseSignature) {
      return assignmentState.photoIds
    }

    return baseLayout ? baseLayout.tiles.map((tile) => tile.photoId) : []
  }, [assignmentState.photoIds, assignmentState.signature, baseLayout, baseSignature])

  const layout = useMemo((): CollageLayout | null => {
    if (!baseLayout) return null
    return applyAssignedPhotoIds(baseLayout, assignedPhotoIds)
  }, [assignedPhotoIds, baseLayout])

  const regenerate = useCallback(() => {
    setSeed((s) => s + 1)
  }, [])

  const shuffleStyle = useCallback(() => {
    setSettings((s) => {
      const idx = STYLES.indexOf(s.style)
      return { ...s, style: STYLES[(idx + 1) % STYLES.length] }
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<CollageSettings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const swapTiles = useCallback(
    (fromIndex: number, toIndex: number) => {
      setAssignmentState((current) => {
        const fallbackPhotoIds = baseLayout
          ? baseLayout.tiles.map((tile) => tile.photoId)
          : []
        const sourcePhotoIds =
          current.signature === baseSignature ? current.photoIds : fallbackPhotoIds

        return {
          signature: baseSignature,
          photoIds: swapAssignedPhotoIds(sourcePhotoIds, fromIndex, toIndex),
        }
      })
    },
    [baseLayout, baseSignature]
  )

  return {
    layout,
    settings,
    scoredPhotos,
    regenerate,
    shuffleStyle,
    updateSettings,
    setStyle: (style: CollageStyle) => updateSettings({ style }),
    setCanvasPreset: (canvasPreset: CanvasPreset) =>
      updateSettings({ canvasPreset }),
    setDensity: (density: CollageDensity) => updateSettings({ density }),
    setTitle: (title: string) => updateSettings({ title }),
    swapTiles,
  }
}
