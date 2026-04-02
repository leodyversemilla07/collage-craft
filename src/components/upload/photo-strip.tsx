import { useRef, useState, useEffect, useCallback } from "react"
import { X, Trash, CaretLeft, CaretRight } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Photo } from "@/types"

interface PhotoStripProps {
  photos: Photo[]
  onRemove: (id: string) => void
  onClear: () => void
}

export function PhotoStrip({ photos, onRemove, onClear }: PhotoStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    updateScrollState()
  }, [photos, updateScrollState])

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -120 : 120,
      behavior: "smooth",
    })
  }

  if (photos.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={onClear}
          className="h-5 gap-1 text-xs"
        >
          <Trash size={11} />
          Clear all
        </Button>
      </div>

      <div className="relative">
        {/* Left fade + arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute top-1/2 left-0 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md ring-1 ring-border/50 backdrop-blur-sm transition-colors hover:bg-muted"
            aria-label="Scroll left"
          >
            <CaretLeft size={11} weight="bold" />
          </button>
        )}

        {/* Right fade + arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute top-1/2 right-0 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md ring-1 ring-border/50 backdrop-blur-sm transition-colors hover:bg-muted"
            aria-label="Scroll right"
          >
            <CaretRight size={11} weight="bold" />
          </button>
        )}

        {/* Scrollable strip */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="scrollbar-hide -mx-1 -my-2 flex gap-1.5 overflow-x-auto px-1 py-2"
        >
          {photos.map((photo) => (
            <div key={photo.id} className="group relative shrink-0">
              <img
                src={photo.previewUrl}
                alt={photo.name}
                className="h-14 w-14 rounded-md object-cover ring-1 ring-border/50"
              />
              <button
                onClick={() => onRemove(photo.id)}
                className={cn(
                  "absolute -top-1.5 -right-1.5 z-10 flex h-4 w-4 items-center justify-center",
                  "rounded-full bg-foreground text-background",
                  "opacity-0 transition-opacity group-hover:opacity-100",
                  "outline-none focus-visible:opacity-100"
                )}
                aria-label={`Remove ${photo.name}`}
              >
                <X size={8} weight="bold" />
              </button>
              {/* Score badge */}
              {photo.score > 0 && (
                <div className="absolute bottom-0.5 left-0.5 rounded bg-black/50 px-1 py-px text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="font-mono text-[9px]">
                    {(photo.score * 100).toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
