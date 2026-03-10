import { GridFour, Newspaper, Scissors } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type { CollageStyle } from "@/types"

interface StyleSelectorProps {
  value: CollageStyle
  onChange: (style: CollageStyle) => void
}

const STYLES: {
  id: CollageStyle
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    id: "magazine",
    label: "Magazine",
    description: "Hero + editorial",
    icon: <Newspaper size={15} />,
  },
  {
    id: "grid",
    label: "Grid",
    description: "Clean & uniform",
    icon: <GridFour size={15} />,
  },
  {
    id: "scrapbook",
    label: "Scrapbook",
    description: "Playful layers",
    icon: <Scissors size={15} />,
  },
]

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium tracking-wider text-muted-foreground/70 uppercase">
        Layout Style
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition-all duration-150",
              value === s.id
                ? "border-primary/60 bg-primary/8 text-foreground shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-muted/30 hover:text-foreground/70"
            )}
          >
            <span
              className={cn(
                value === s.id ? "text-foreground" : "text-muted-foreground/60"
              )}
            >
              {s.icon}
            </span>
            <span className="text-xs leading-none font-medium">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
