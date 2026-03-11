import type { CollageLayout } from "@/types"

export function getTileAssignmentSignature(
  layout: CollageLayout | null
): string {
  if (!layout) {
    return ""
  }

  return layout.tiles.map((tile) => tile.photoId).join("|")
}

export function swapAssignedPhotoIds(
  photoIds: string[],
  fromIndex: number,
  toIndex: number
): string[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= photoIds.length ||
    toIndex >= photoIds.length
  ) {
    return photoIds
  }

  const nextPhotoIds = [...photoIds]
  ;[nextPhotoIds[fromIndex], nextPhotoIds[toIndex]] = [
    nextPhotoIds[toIndex],
    nextPhotoIds[fromIndex],
  ]
  return nextPhotoIds
}

export function applyAssignedPhotoIds(
  layout: CollageLayout,
  photoIds: string[]
): CollageLayout {
  if (photoIds.length !== layout.tiles.length) {
    return layout
  }

  return {
    ...layout,
    tiles: layout.tiles.map((tile, index) => ({
      ...tile,
      photoId: photoIds[index] ?? tile.photoId,
    })),
  }
}
