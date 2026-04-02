import { useCallback, useEffect, useRef, useState } from "react"
import {
  GridFour,
  SlidersHorizontal,
  X,
  Sun,
  Moon,
  Monitor,
} from "@phosphor-icons/react"

import { CollageCanvas } from "@/components/canvas/collage-canvas"
import { ControlsPanel } from "@/components/controls/controls-panel"
import { useTheme } from "@/components/theme-provider"
import { useCanvasExport } from "@/hooks/use-canvas-export"
import { useCollage } from "@/hooks/use-collage"
import { useIsDark } from "@/hooks/use-is-dark"
import { usePhotoUpload } from "@/hooks/use-photo-upload"
import { cn } from "@/lib/utils"
import type { CanvasPreset, CollageDensity, CollageStyle } from "@/types"

export function App() {
  const { photos, addFiles, removePhoto, clearPhotos, togglePinned } =
    usePhotoUpload()
  const {
    layout,
    settings,
    scoredPhotos,
    regenerate,
    shuffleStyle,
    setStyle,
    setCanvasPreset,
    setDensity,
    setTitle,
    swapTiles,
  } = useCollage(photos)
  const { isExporting, exportCollage } = useCanvasExport()
  const isDark = useIsDark()
  const { theme, setTheme } = useTheme()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const cycleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")
  }, [theme, setTheme])

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor
  const nextThemeLabel =
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light"

  const imageMapRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const [imageMap, setImageMap] = useState<Map<string, HTMLImageElement>>(
    new Map()
  )

  const evictStaleCacheEntries = useCallback(
    (cache: Map<string, HTMLImageElement>) => {
      const ids = new Set(photos.map((photo) => photo.id))
      let changed = false

      for (const key of cache.keys()) {
        if (!ids.has(key)) {
          cache.delete(key)
          changed = true
        }
      }

      return changed
    },
    [photos]
  )

  useEffect(() => {
    const cache = imageMapRef.current
    const toLoad = photos.filter((photo) => !cache.has(photo.id))

    if (toLoad.length === 0) {
      if (evictStaleCacheEntries(cache)) {
        setImageMap(new Map(cache))
      }
      return
    }

    Promise.all(
      toLoad.map(
        (photo) =>
          new Promise<void>((resolve) => {
            const img = new Image()
            img.onload = () => {
              cache.set(photo.id, img)
              resolve()
            }
            img.onerror = () => resolve()
            img.src = photo.previewUrl
          })
      )
    ).then(() => {
      evictStaleCacheEntries(cache)
      setImageMap(new Map(cache))
    })
  }, [photos, evictStaleCacheEntries])

  const handleExport = useCallback(() => {
    if (!layout) return
    exportCollage(imageMap, layout, settings, isDark)
  }, [exportCollage, imageMap, layout, settings, isDark])

  const displayPhotos = scoredPhotos.length > 0 ? scoredPhotos : photos

  const controlsProps = {
    photos: displayPhotos,
    settings,
    layout,
    isExporting,
    onAddFiles: addFiles,
    onRemovePhoto: removePhoto,
    onClearPhotos: clearPhotos,
    onTogglePinned: togglePinned,
    onStyleChange: (style: CollageStyle) => setStyle(style),
    onPresetChange: (preset: CanvasPreset) => setCanvasPreset(preset),
    onDensityChange: (density: CollageDensity) => setDensity(density),
    onTitleChange: setTitle,
    onRegenerate: regenerate,
    onShuffleStyle: shuffleStyle,
    onExport: handleExport,
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-border/60 bg-card/80 px-4 backdrop-blur-sm">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background">
          <GridFour size={12} weight="bold" />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          Collage Craft
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={cycleTheme}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5",
              "text-[11px] font-medium text-foreground/80 transition-colors hover:bg-muted"
            )}
            aria-label={`Switch to ${nextThemeLabel} theme`}
            title={`Theme: ${theme}. Click to switch to ${nextThemeLabel}.`}
          >
            <ThemeIcon size={13} />
            <span className="hidden sm:inline">{theme}</span>
          </button>

          <div className="hidden text-xs text-muted-foreground/40 select-none md:block">
            Press{" "}
            <kbd className="rounded border border-border px-1 py-px font-mono text-xs">
              d
            </kbd>{" "}
            to flip light/dark
          </div>
        </div>

        <button
          onClick={() => setDrawerOpen((open) => !open)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-foreground/70 md:hidden"
          aria-label="Toggle controls"
        >
          {drawerOpen ? <X size={13} /> : <SlidersHorizontal size={13} />}
        </button>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        <div className="hidden md:flex">
          <ControlsPanel {...controlsProps} />
        </div>

        {drawerOpen && (
          <div
            className="absolute inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        <div
          className={cn(
            "absolute right-0 bottom-0 left-0 z-30 flex translate-y-full flex-col rounded-t-2xl border-t border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
            drawerOpen && "translate-y-0"
          )}
        >
          <div className="flex shrink-0 justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-border/70" />
          </div>
          <ControlsPanel
            {...controlsProps}
            mobile
            onClose={() => setDrawerOpen(false)}
          />
        </div>

        <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/10 p-4 sm:p-6 md:p-8">
          <CollageCanvas
            photos={displayPhotos}
            layout={layout}
            settings={settings}
            imageMap={imageMap}
            isDark={isDark}
            onSwapTiles={swapTiles}
          />

          {!drawerOpen && (
            <button
              onClick={() => setDrawerOpen(true)}
              className={cn(
                "absolute right-4 bottom-4 z-10 flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-medium text-background shadow-lg transition-all active:scale-95 md:hidden"
              )}
            >
              <SlidersHorizontal size={12} />
              Controls
            </button>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
