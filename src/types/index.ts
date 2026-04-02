export type CollageStyle = "grid" | "scrapbook" | "magazine"

export type CollageDensity = "loose" | "normal" | "tight"

export interface CanvasPreset {
  id: string
  label: string
  width: number
  height: number
}

export interface Photo {
  id: string
  file: File
  name: string
  previewUrl: string
  width: number
  height: number
  aspectRatio: number
  orientation: "landscape" | "portrait" | "square"
  fileSize: number
  /** Normalized 0–1 score assigned by the scoring module. */
  score: number
  /** Pinned photos are kept at the front of generated layouts. */
  isPinned: boolean
}

export interface LayoutTile {
  photoId: string
  x: number
  y: number
  width: number
  height: number
  /** Optional rotation in degrees (used by scrapbook style). */
  rotation?: number
}

export interface CollageLayout {
  tiles: LayoutTile[]
  canvasWidth: number
  canvasHeight: number
}

export interface CollageSettings {
  style: CollageStyle
  canvasPreset: CanvasPreset
  density: CollageDensity
  title: string
}
