import { useRef, useEffect, useMemo, useCallback, useState } from "react"
import type { CSSProperties } from "react"
import type { Photo, CollageLayout, CollageSettings, LayoutTile } from "@/types"
import { renderCollage } from "@/lib/canvas-renderer"
import { cn } from "@/lib/utils"
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
  onSwapTiles?: (fromIndex: number, toIndex: number) => void
}

interface DragState {
  tileIndex: number
  pointerX: number
  pointerY: number
  offsetX: number
  offsetY: number
}

function toPercent(value: number, total: number): string {
  return `${(value / total) * 100}%`
}

export function CollageCanvas({
  photos,
  layout,
  settings,
  imageMap,
  isDark,
  onSwapTiles,
}: CollageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const previewLayout = useMemo((): CollageLayout | null => {
    if (!layout) {
      return null
    }

    return {
      canvasWidth: Math.round(layout.canvasWidth * PREVIEW_SCALE),
      canvasHeight: Math.round(layout.canvasHeight * PREVIEW_SCALE),
      tiles: layout.tiles.map((tile) => ({
        ...tile,
        x: tile.x * PREVIEW_SCALE,
        y: tile.y * PREVIEW_SCALE,
        width: tile.width * PREVIEW_SCALE,
        height: tile.height * PREVIEW_SCALE,
      })),
    }
  }, [layout])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !previewLayout || imageMap.size === 0) return

    renderCollage(canvas, imageMap, previewLayout, settings, isDark)
  }, [previewLayout, settings, imageMap, isDark])

  const photoUrlById = useMemo(
    () => new Map(photos.map((photo) => [photo.id, photo.previewUrl])),
    [photos]
  )

  const getLayoutPoint = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      if (!canvas || !previewLayout) {
        return null
      }

      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        return null
      }

      return {
        x: ((clientX - rect.left) * previewLayout.canvasWidth) / rect.width,
        y: ((clientY - rect.top) * previewLayout.canvasHeight) / rect.height,
      }
    },
    [previewLayout]
  )

  const getTileIndexAtPoint = useCallback(
    (clientX: number, clientY: number): number | null => {
      const point = getLayoutPoint(clientX, clientY)
      if (!point || !previewLayout) {
        return null
      }

      for (let index = previewLayout.tiles.length - 1; index >= 0; index -= 1) {
        const tile = previewLayout.tiles[index]
        if (
          point.x >= tile.x &&
          point.x <= tile.x + tile.width &&
          point.y >= tile.y &&
          point.y <= tile.y + tile.height
        ) {
          return index
        }
      }

      return null
    },
    [getLayoutPoint, previewLayout]
  )

  const finishDrag = useCallback(
    (
      targetIndex: number | null,
      pointerTarget?: EventTarget & HTMLCanvasElement,
      pointerId?: number
    ) => {
      if (
        pointerTarget &&
        pointerId !== undefined &&
        pointerTarget.hasPointerCapture(pointerId)
      ) {
        pointerTarget.releasePointerCapture(pointerId)
      }

      if (
        onSwapTiles &&
        dragState !== null &&
        targetIndex !== null &&
        targetIndex !== dragState.tileIndex
      ) {
        onSwapTiles(dragState.tileIndex, targetIndex)
      }

      setDragState(null)
      setHoverIndex(null)
    },
    [dragState, onSwapTiles]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (event.button !== 0 || !onSwapTiles || !previewLayout) {
        return
      }

      const targetIndex = getTileIndexAtPoint(event.clientX, event.clientY)
      if (targetIndex === null) {
        return
      }

      const point = getLayoutPoint(event.clientX, event.clientY)
      if (!point) {
        return
      }

      const tile = previewLayout.tiles[targetIndex]
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragState({
        tileIndex: targetIndex,
        pointerX: point.x,
        pointerY: point.y,
        offsetX: point.x - tile.x,
        offsetY: point.y - tile.y,
      })
      setHoverIndex(targetIndex)
    },
    [getLayoutPoint, getTileIndexAtPoint, onSwapTiles, previewLayout]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragState === null) {
        return
      }

      const point = getLayoutPoint(event.clientX, event.clientY)
      if (!point) {
        return
      }

      setDragState((current) =>
        current
          ? {
              ...current,
              pointerX: point.x,
              pointerY: point.y,
            }
          : current
      )
      setHoverIndex(getTileIndexAtPoint(event.clientX, event.clientY))
    },
    [dragState, getLayoutPoint, getTileIndexAtPoint]
  )

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragState === null) {
        return
      }

      finishDrag(
        getTileIndexAtPoint(event.clientX, event.clientY),
        event.currentTarget,
        event.pointerId
      )
    },
    [dragState, finishDrag, getTileIndexAtPoint]
  )

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragState === null) {
        return
      }

      finishDrag(null, event.currentTarget, event.pointerId)
    },
    [dragState, finishDrag]
  )

  const canSwap = Boolean(onSwapTiles && previewLayout && previewLayout.tiles.length > 1)
  const activeDragIndex =
    dragState !== null &&
    previewLayout &&
    dragState.tileIndex < previewLayout.tiles.length
      ? dragState.tileIndex
      : null
  const activeHoverIndex =
    hoverIndex !== null && previewLayout && hoverIndex < previewLayout.tiles.length
      ? hoverIndex
      : null
  const statusMessage =
    activeDragIndex === null
      ? "Drag one photo onto another to swap positions."
      : activeHoverIndex !== null && activeHoverIndex !== activeDragIndex
        ? "Release to swap these photos."
        : "Drop onto another photo to swap."
  const draggedTile =
    activeDragIndex !== null && previewLayout
      ? previewLayout.tiles[activeDragIndex]
      : null
  const hoveredTile =
    activeHoverIndex !== null &&
    activeHoverIndex !== activeDragIndex &&
    previewLayout
      ? previewLayout.tiles[activeHoverIndex]
      : null
  const draggedPhotoUrl =
    draggedTile !== null ? photoUrlById.get(draggedTile.photoId) : undefined

  const getTileStyle = useCallback(
    (tile: LayoutTile): CSSProperties => ({
      left: toPercent(tile.x, previewLayout?.canvasWidth ?? 1),
      top: toPercent(tile.y, previewLayout?.canvasHeight ?? 1),
      width: toPercent(tile.width, previewLayout?.canvasWidth ?? 1),
      height: toPercent(tile.height, previewLayout?.canvasHeight ?? 1),
      transform: tile.rotation ? `rotate(${tile.rotation}deg)` : undefined,
      transformOrigin: "center center",
    }),
    [previewLayout]
  )

  const dragGhostStyle = useMemo((): CSSProperties | undefined => {
    if (!dragState || !draggedTile || !previewLayout) {
      return undefined
    }

    return {
      left: toPercent(dragState.pointerX - dragState.offsetX, previewLayout.canvasWidth),
      top: toPercent(dragState.pointerY - dragState.offsetY, previewLayout.canvasHeight),
      width: toPercent(draggedTile.width, previewLayout.canvasWidth),
      height: toPercent(draggedTile.height, previewLayout.canvasHeight),
      transform: `${
        draggedTile.rotation ? `rotate(${draggedTile.rotation}deg) ` : ""
      }scale(1.03)`,
      transformOrigin: "center center",
    }
  }, [dragState, draggedTile, previewLayout])

  if (!layout || photos.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-block">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            touchAction: canSwap ? "none" : "auto",
          }}
          className={cn(
            "rounded-lg shadow-2xl",
            canSwap &&
              (activeDragIndex === null ? "cursor-grab" : "cursor-grabbing")
          )}
          aria-label={
            canSwap
              ? "Collage preview. Drag one photo onto another to swap positions."
              : "Collage preview"
          }
        />

        {previewLayout && canSwap && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
            {draggedTile && (
              <div
                style={getTileStyle(draggedTile)}
                className="absolute rounded-lg border border-dashed border-primary/55 bg-background/72 backdrop-blur-[2px] transition-all duration-150"
              />
            )}

            {hoveredTile && (
              <div
                style={getTileStyle(hoveredTile)}
                className="absolute rounded-lg ring-2 ring-primary/80 ring-offset-2 ring-offset-background transition-all duration-150"
              />
            )}

            {draggedPhotoUrl && dragGhostStyle && (
              <div
                style={dragGhostStyle}
                className="absolute overflow-hidden rounded-lg shadow-[0_18px_40px_rgba(0,0,0,0.28)] ring-2 ring-white/75 opacity-95 transition-none dark:ring-white/15"
              >
                <img
                  src={draggedPhotoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {canSwap && (
        <p className="text-center text-[11px] text-muted-foreground/75">
          {statusMessage}
        </p>
      )}
    </div>
  )
}
