import type { CollageLayout, CollageSettings, LayoutTile, Photo } from "@/types"

// ─── Canvas drawing helpers ───────────────────────────────────────────────────

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.arcTo(x + w, y, x + w, y + radius, radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius)
  ctx.lineTo(x + radius, y + h)
  ctx.arcTo(x, y + h, x, y + h - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

/** Draw an image cropped to fill the destination rect (CSS object-fit: cover). */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const scale = Math.max(dw / img.naturalWidth, dh / img.naturalHeight)
  const sw = dw / scale
  const sh = dh / scale
  const sx = (img.naturalWidth - sw) / 2
  const sy = (img.naturalHeight - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

function getTileRadius(style: string): number {
  if (style === "scrapbook") return 10
  if (style === "magazine") return 6
  return 4
}

function getBackground(style: string, isDark: boolean): string {
  if (isDark) {
    return style === "scrapbook" ? "#1c1814" : "#111111"
  }
  if (style === "scrapbook") return "#f4efe6"
  if (style === "magazine") return "#ffffff"
  return "#f6f6f6"
}

// ─── Image loading ────────────────────────────────────────────────────────────

export async function loadImages(
  photos: Photo[]
): Promise<Map<string, HTMLImageElement>> {
  const entries = await Promise.all(
    photos.map(
      (photo) =>
        new Promise<[string, HTMLImageElement]>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve([photo.id, img])
          img.onerror = reject
          img.src = photo.previewUrl
        })
    )
  )
  return new Map(entries)
}

// ─── Collage renderer ─────────────────────────────────────────────────────────

export function renderCollage(
  canvas: HTMLCanvasElement,
  imageMap: Map<string, HTMLImageElement>,
  layout: CollageLayout,
  settings: CollageSettings,
  isDark = false
): void {
  const { canvasWidth: cW, canvasHeight: cH, tiles } = layout
  canvas.width = cW
  canvas.height = cH

  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const radius = getTileRadius(settings.style)
  const hasShadow = settings.style !== "grid"

  ctx.fillStyle = getBackground(settings.style, isDark)
  ctx.fillRect(0, 0, cW, cH)

  for (const tile of tiles) {
    const img = imageMap.get(tile.photoId)
    if (!img) continue

    ctx.save()

    // Apply rotation around the tile's center
    if (tile.rotation) {
      const cx = tile.x + tile.width / 2
      const cy = tile.y + tile.height / 2
      ctx.translate(cx, cy)
      ctx.rotate((tile.rotation * Math.PI) / 180)
      ctx.translate(-cx, -cy)
    }

    // 1. Shadow pass — drawn outside the clip so shadow spreads beyond tile edges
    if (hasShadow) {
      ctx.save()
      ctx.shadowColor = isDark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.18)"
      ctx.shadowBlur = 18
      ctx.shadowOffsetY = 5
      ctx.fillStyle = isDark ? "#222222" : "#ffffff"
      drawRoundedRect(ctx, tile.x, tile.y, tile.width, tile.height, radius)
      ctx.fill()
      ctx.restore()
    }

    // 2. Image pass — clipped to rounded rect for clean edges
    ctx.save()
    drawRoundedRect(ctx, tile.x, tile.y, tile.width, tile.height, radius)
    ctx.clip()
    drawImageCover(ctx, img, tile.x, tile.y, tile.width, tile.height)

    // Magazine hero tile: subtle darkening gradient at the bottom
    if (settings.style === "magazine" && tile === tiles[0]) {
      const grad = ctx.createLinearGradient(
        tile.x,
        tile.y + tile.height * 0.45,
        tile.x,
        tile.y + tile.height
      )
      grad.addColorStop(0, "rgba(0,0,0,0)")
      grad.addColorStop(1, "rgba(0,0,0,0.38)")
      ctx.fillStyle = grad
      ctx.fillRect(tile.x, tile.y, tile.width, tile.height)
    }
    ctx.restore()

    // 3. Grid style: very subtle inner border
    if (settings.style === "grid") {
      ctx.save()
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
      ctx.lineWidth = 1
      drawRoundedRect(
        ctx,
        tile.x + 0.5,
        tile.y + 0.5,
        tile.width - 1,
        tile.height - 1,
        radius
      )
      ctx.stroke()
      ctx.restore()
    }

    ctx.restore() // restore rotation transform
  }

  // Collage title
  if (settings.title.trim()) {
    const fontSize = Math.max(18, Math.round(cW * 0.022))
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif`
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.68)"
    ctx.textAlign = "center"
    ctx.textBaseline = "bottom"
    ctx.fillText(settings.title.trim(), cW / 2, cH - 10)
  }
}

/** Re-render at 2× resolution and trigger a PNG download. */
export function exportCollagePng(
  imageMap: Map<string, HTMLImageElement>,
  layout: CollageLayout,
  settings: CollageSettings,
  isDark: boolean
): Promise<void> {
  const scale = 2
  const exportCanvas = document.createElement("canvas")

  const scaledLayout: CollageLayout = {
    canvasWidth: layout.canvasWidth * scale,
    canvasHeight: layout.canvasHeight * scale,
    tiles: layout.tiles.map((t) => ({
      ...t,
      x: t.x * scale,
      y: t.y * scale,
      width: t.width * scale,
      height: t.height * scale,
    })),
  }

  renderCollage(exportCanvas, imageMap, scaledLayout, settings, isDark)

  return new Promise((resolve, reject) => {
    exportCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to export collage PNG."))
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `collagecraft-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      resolve()
    }, "image/png")
  })
}

// Re-export LayoutTile so canvas-renderer is the single import for rendering logic
export type { LayoutTile }
