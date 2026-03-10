import { useRef, useState, useCallback } from "react"
import { UploadSimple } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface UploadZoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export function UploadZone({ onFiles, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      onFiles(Array.from(files))
    },
    [onFiles]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const trigger = () => {
    if (!disabled) inputRef.current?.click()
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload photos — click or drag and drop"
      onClick={trigger}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && trigger()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border-2 border-dashed px-4 py-7 transition-all duration-150",
        isDragging
          ? "scale-[1.01] border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/20",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <div className="rounded-full bg-muted/60 p-3">
        <UploadSimple size={18} className="text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-foreground/80">
          {isDragging ? "Drop photos here" : "Upload photos"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          drag & drop or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground/40">
          JPG · PNG · WEBP
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => {
          // Allow re-selecting the same files
          ;(e.target as HTMLInputElement).value = ""
        }}
      />
    </div>
  )
}
