import { Images } from "@phosphor-icons/react"

export function EmptyState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 select-none">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/20">
        <Images size={36} weight="thin" className="text-muted-foreground/40" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground/50">
          No photos uploaded yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground/40">
          Upload photos using the panel on the left
        </p>
      </div>
    </div>
  )
}
