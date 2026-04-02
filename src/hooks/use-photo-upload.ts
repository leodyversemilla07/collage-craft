import { useState, useCallback, useEffect, useRef } from "react"
import type { Photo } from "@/types"
import {
  loadPersistedPhotos,
  savePersistedPhotos,
} from "@/lib/persisted-photos"

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function revokePhotoUrls(photos: Photo[]) {
  photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
}

function getPhotoDedupKey(photo: Pick<Photo, "name" | "fileSize">): string {
  return `${photo.name}-${photo.fileSize}`
}

export function splitFreshAndDuplicatePhotos(
  existingPhotos: Pick<Photo, "name" | "fileSize">[],
  incomingPhotos: Photo[]
): { fresh: Photo[]; duplicates: Photo[] } {
  const knownKeys = new Set(existingPhotos.map(getPhotoDedupKey))
  const fresh: Photo[] = []
  const duplicates: Photo[] = []

  for (const photo of incomingPhotos) {
    const key = getPhotoDedupKey(photo)

    if (knownKeys.has(key)) {
      duplicates.push(photo)
      continue
    }

    knownKeys.add(key)
    fresh.push(photo)
  }

  return { fresh, duplicates }
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
        isPinned: false,
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
  const [isHydrated, setIsHydrated] = useState(false)
  const photosRef = useRef<Photo[]>([])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    return () => {
      revokePhotoUrls(photosRef.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    loadPersistedPhotos().then((persistedPhotos) => {
      if (cancelled) {
        revokePhotoUrls(persistedPhotos)
        return
      }

      setPhotos((current) => {
        if (current.length > 0 || persistedPhotos.length === 0) {
          revokePhotoUrls(persistedPhotos)
          return current
        }

        return persistedPhotos
      })
      setIsHydrated(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    void savePersistedPhotos(photos)
  }, [isHydrated, photos])

  const addFiles = useCallback(async (files: File[]) => {
    const results = await Promise.all(files.map(readPhotoFile))
    const valid = results.filter((p): p is Photo => p !== null)
    if (valid.length === 0) return

    setPhotos((prev) => {
      // Deduplicate by file name + size to prevent double uploads.
      // Track accepted keys as we iterate so duplicates in the same batch are dropped.
      const { fresh, duplicates } = splitFreshAndDuplicatePhotos(prev, valid)
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

  const togglePinned = useCallback((id: string) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === id ? { ...photo, isPinned: !photo.isPinned } : photo
      )
    )
  }, [])

  return { photos, addFiles, removePhoto, clearPhotos, togglePinned, isHydrated }
}
