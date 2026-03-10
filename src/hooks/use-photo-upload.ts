import { useState, useCallback, useEffect, useRef } from "react"
import type { Photo } from "@/types"

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function revokePhotoUrls(photos: Photo[]) {
  photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
}

async function readPhotoFile(file: File): Promise<Photo | null> {
  if (!ACCEPTED_TYPES.has(file.type)) return null

  return new Promise((resolve) => {
    const previewUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const ar = w / h
      resolve({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        previewUrl,
        width: w,
        height: h,
        aspectRatio: ar,
        orientation: ar > 1.1 ? "landscape" : ar < 0.9 ? "portrait" : "square",
        fileSize: file.size,
        score: 0,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(previewUrl)
      resolve(null)
    }

    img.src = previewUrl
  })
}

export function usePhotoUpload() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const photosRef = useRef<Photo[]>([])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    return () => {
      revokePhotoUrls(photosRef.current)
    }
  }, [])

  const addFiles = useCallback(async (files: File[]) => {
    const results = await Promise.all(files.map(readPhotoFile))
    const valid = results.filter((p): p is Photo => p !== null)
    if (valid.length === 0) return

    setPhotos((prev) => {
      // Deduplicate by file name + size to prevent double uploads
      const existingKeys = new Set(prev.map((p) => `${p.name}-${p.fileSize}`))
      const fresh = valid.filter(
        (p) => !existingKeys.has(`${p.name}-${p.fileSize}`)
      )
      const duplicates = valid.filter((p) =>
        existingKeys.has(`${p.name}-${p.fileSize}`)
      )
      revokePhotoUrls(duplicates)
      return [...prev, ...fresh]
    })
  }, [])

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id)
      revokePhotoUrls(prev.filter((p) => p.id === id))
      return next
    })
  }, [])

  const clearPhotos = useCallback(() => {
    setPhotos((prev) => {
      revokePhotoUrls(prev)
      return []
    })
  }, [])

  return { photos, addFiles, removePhoto, clearPhotos }
}
