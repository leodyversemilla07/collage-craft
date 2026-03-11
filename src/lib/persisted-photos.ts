import type { Photo } from "@/types"

const DB_NAME = "collage-craft"
const DB_VERSION = 1
const STORE_NAME = "app-state"
const PHOTOS_KEY = "photos"

export interface PersistedPhotoRecord {
  id: string
  file: File
  name: string
  width: number
  height: number
  aspectRatio: number
  orientation: Photo["orientation"]
  fileSize: number
}

function supportsIndexedDb(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."))
  })
}

function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  return openDatabase().then(async (db) => {
    try {
      const tx = db.transaction(STORE_NAME, mode)
      const store = tx.objectStore(STORE_NAME)
      const result = await operation(store)

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () =>
          reject(tx.error ?? new Error("IndexedDB transaction failed."))
        tx.onabort = () =>
          reject(tx.error ?? new Error("IndexedDB transaction aborted."))
      })

      return result
    } finally {
      db.close()
    }
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."))
  })
}

export function serializePhoto(photo: Photo): PersistedPhotoRecord {
  return {
    id: photo.id,
    file: photo.file,
    name: photo.name,
    width: photo.width,
    height: photo.height,
    aspectRatio: photo.aspectRatio,
    orientation: photo.orientation,
    fileSize: photo.fileSize,
  }
}

export function hydratePersistedPhoto(photo: PersistedPhotoRecord): Photo {
  return {
    ...photo,
    previewUrl: URL.createObjectURL(photo.file),
    score: 0,
  }
}

export async function loadPersistedPhotos(): Promise<Photo[]> {
  if (!supportsIndexedDb()) {
    return []
  }

  try {
    const records =
      (await withStore("readonly", (store) =>
        requestToPromise<PersistedPhotoRecord[] | undefined>(
          store.get(PHOTOS_KEY)
        )
      )) ?? []

    return records.map(hydratePersistedPhoto)
  } catch {
    return []
  }
}

export async function savePersistedPhotos(photos: Photo[]): Promise<void> {
  if (!supportsIndexedDb()) {
    return
  }

  const records = photos.map(serializePhoto)

  try {
    await withStore("readwrite", (store) =>
      requestToPromise(store.put(records, PHOTOS_KEY)).then(() => undefined)
    )
  } catch {
    // Ignore persistence failures so uploads still work in-memory.
  }
}
