import { ArrowsClockwise, Shuffle, DownloadSimple } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { UploadZone } from "@/components/upload/upload-zone"
import { PhotoStrip } from "@/components/upload/photo-strip"
import { StyleSelector } from "./style-selector"
import { CanvasSizeControl } from "./canvas-size-control"
import type {
  Photo,
  CollageSettings,
  CanvasPreset,
  CollageDensity,
  CollageStyle,
  CollageLayout,
} from "@/types"

interface ControlsPanelProps {
  photos: Photo[]
  settings: CollageSettings
  layout: CollageLayout | null
  isExporting: boolean
  /** When true the panel renders in mobile-drawer mode (max-height, rounded top) */
  mobile?: boolean
  onClose?: () => void
  onAddFiles: (files: File[]) => void
  onRemovePhoto: (id: string) => void
  onClearPhotos: () => void
  onTogglePinned: (id: string) => void
  onStyleChange: (style: CollageStyle) => void
  onPresetChange: (preset: CanvasPreset) => void
  onDensityChange: (density: CollageDensity) => void
  onTitleChange: (title: string) => void
  onRegenerate: () => void
  onShuffleStyle: () => void
  onExport: () => void
}

export function ControlsPanel({
  photos,
  settings,
  layout,
  isExporting,
  mobile,
  onClose,
  onAddFiles,
  onRemovePhoto,
  onClearPhotos,
  onTogglePinned,
  onStyleChange,
  onPresetChange,
  onDensityChange,
  onTitleChange,
  onRegenerate,
  onShuffleStyle,
  onExport,
}: ControlsPanelProps) {
  const hasPhotos = photos.length > 0
  const hasLayout = layout !== null

  const content = (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <section className="space-y-3">
        <UploadZone
          onFiles={(files) => {
            onAddFiles(files)
          }}
        />
        <PhotoStrip
          photos={photos}
          onRemove={onRemovePhoto}
          onClear={onClearPhotos}
          onTogglePinned={onTogglePinned}
        />
      </section>

      {hasPhotos && (
        <>
          <div className="h-px bg-border/60" />

          <StyleSelector value={settings.style} onChange={onStyleChange} />

          <CanvasSizeControl
            canvasPreset={settings.canvasPreset}
            density={settings.density}
            onPresetChange={onPresetChange}
            onDensityChange={onDensityChange}
          />

          <div className="space-y-1.5">
            <p className="text-xs font-medium tracking-wider text-muted-foreground/70 uppercase">
              Title
            </p>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Optional collage title…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs transition-shadow placeholder:text-muted-foreground/40 focus:border-ring focus:ring-1 focus:ring-ring/30 focus:outline-none"
            />
          </div>

          <div className="h-px bg-border/60" />

          <section className="flex flex-col gap-2">
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={onRegenerate}
                disabled={!hasLayout}
              >
                <ArrowsClockwise size={13} />
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onShuffleStyle}
                disabled={!hasPhotos}
                title="Shuffle to next style"
                className="px-2.5"
              >
                <Shuffle size={13} />
              </Button>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onExport()
                onClose?.()
              }}
              disabled={!hasLayout || isExporting}
              className="w-full gap-1.5"
            >
              <DownloadSimple size={13} />
              {isExporting ? "Exporting…" : "Export PNG"}
            </Button>
          </section>
        </>
      )}
    </div>
  )

  if (mobile) {
    return (
      <div className="flex max-h-[80dvh] flex-col overflow-y-auto">
        {content}
      </div>
    )
  }

  return (
    <aside className="flex h-full w-[296px] shrink-0 flex-col overflow-y-auto border-r border-border bg-card">
      {content}
    </aside>
  )
}
