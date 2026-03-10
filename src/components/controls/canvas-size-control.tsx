import { cn } from "@/lib/utils"
import { CANVAS_PRESETS } from "@/lib/constants"
import type { CanvasPreset, CollageDensity } from "@/types"

interface CanvasSizeControlProps {
  canvasPreset: CanvasPreset
  density: CollageDensity
  onPresetChange: (preset: CanvasPreset) => void
  onDensityChange: (density: CollageDensity) => void
}

const DENSITIES: { id: CollageDensity; label: string }[] = [
  { id: "loose", label: "Loose" },
  { id: "normal", label: "Normal" },
  { id: "tight", label: "Tight" },
]

export function CanvasSizeControl({
  canvasPreset,
  density,
  onPresetChange,
  onDensityChange,
}: CanvasSizeControlProps) {
  return (
    <div className="space-y-3">
      {/* Canvas size */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium tracking-wider text-muted-foreground/70 uppercase">
          Canvas Size
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {CANVAS_PRESETS.map((preset) => {
            const [format, ratio] = preset.label.split(" ").slice(0, 2)
            const rest = preset.label.split(" ").slice(2).join(" ")
            return (
              <button
                key={preset.id}
                onClick={() => onPresetChange(preset)}
                className={cn(
                  "rounded-lg border px-2.5 py-2 text-left transition-all duration-150",
                  canvasPreset.id === preset.id
                    ? "border-primary/60 bg-primary/8 text-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-muted/30 hover:text-foreground/70"
                )}
              >
                <p className="text-xs leading-tight font-medium">{format}</p>
                <p className="mt-0.5 text-xs leading-tight opacity-60">
                  {ratio} {rest}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Density */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium tracking-wider text-muted-foreground/70 uppercase">
          Spacing
        </p>
        <div className="flex gap-1.5">
          {DENSITIES.map((d) => (
            <button
              key={d.id}
              onClick={() => onDensityChange(d.id)}
              className={cn(
                "flex-1 rounded-lg border py-1.5 text-xs transition-all duration-150",
                density === d.id
                  ? "border-primary/60 bg-primary/8 font-medium text-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-muted/30 hover:text-foreground/70"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
