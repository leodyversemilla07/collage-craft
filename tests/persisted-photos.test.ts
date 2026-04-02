import { describe, expect, test } from "bun:test"

import {
  hydratePersistedPhoto,
  serializePhoto,
  type PersistedPhotoRecord,
} from "../src/lib/persisted-photos"
import { splitFreshAndDuplicatePhotos } from "../src/hooks/use-photo-upload"
import type { Photo } from "../src/types"

function createPhoto(overrides: Partial<Photo> = {}): Photo {
  const file =
    overrides.file ??
    new File(["image"], overrides.name ?? "memory.jpg", { type: "image/jpeg" })

  return {
    id: overrides.id ?? "photo-1",
    file,
    name: overrides.name ?? file.name,
    previewUrl: overrides.previewUrl ?? "blob:test",
    width: overrides.width ?? 1200,
    height: overrides.height ?? 800,
    aspectRatio: overrides.aspectRatio ?? 1.5,
    orientation: overrides.orientation ?? "landscape",
    fileSize: overrides.fileSize ?? file.size,
    score: overrides.score ?? 0.75,
  }
}

describe("persisted photos", () => {
  test("serializes a photo without transient preview state", () => {
    const serialized = serializePhoto(createPhoto())

    expect(serialized).toEqual({
      id: "photo-1",
      file: expect.any(File),
      name: "memory.jpg",
      width: 1200,
      height: 800,
      aspectRatio: 1.5,
      orientation: "landscape",
      fileSize: 5,
    })
  })

  test("hydrates a persisted record into a runtime photo", () => {
    const record: PersistedPhotoRecord = {
      id: "photo-1",
      file: new File(["image"], "memory.jpg", { type: "image/jpeg" }),
      name: "memory.jpg",
      width: 1200,
      height: 800,
      aspectRatio: 1.5,
      orientation: "landscape",
      fileSize: 5,
    }

    const originalCreateObjectUrl = URL.createObjectURL
    URL.createObjectURL = () => "blob:restored-photo"

    try {
      const hydrated = hydratePersistedPhoto(record)

      expect(hydrated).toMatchObject({
        id: "photo-1",
        name: "memory.jpg",
        previewUrl: "blob:restored-photo",
        width: 1200,
        height: 800,
        aspectRatio: 1.5,
        orientation: "landscape",
        fileSize: 5,
        score: 0,
      })
    } finally {
      URL.createObjectURL = originalCreateObjectUrl
    }
  })
})

describe("upload deduplication", () => {
  test("drops photos that already exist in state", () => {
    const existing = [createPhoto()]
    const incoming = [
      createPhoto(),
      createPhoto({
        id: "photo-2",
        name: "second.jpg",
        file: new File(["image-22"], "second.jpg", { type: "image/jpeg" }),
        previewUrl: "blob:test-2",
      }),
    ]

    const { fresh, duplicates } = splitFreshAndDuplicatePhotos(existing, incoming)

    expect(fresh.map((photo) => photo.id)).toEqual(["photo-2"])
    expect(duplicates.map((photo) => photo.id)).toEqual(["photo-1"])
  })

  test("drops duplicates that appear within the same incoming batch", () => {
    const duplicateA = createPhoto({
      id: "photo-a",
      name: "same.jpg",
      file: new File(["image-a"], "same.jpg", { type: "image/jpeg" }),
      previewUrl: "blob:same-a",
    })
    const duplicateB = createPhoto({
      id: "photo-b",
      name: "same.jpg",
      file: new File(["image-b"], "same.jpg", { type: "image/jpeg" }),
      previewUrl: "blob:same-b",
    })

    const { fresh, duplicates } = splitFreshAndDuplicatePhotos([], [
      duplicateA,
      duplicateB,
    ])

    expect(fresh.map((photo) => photo.id)).toEqual(["photo-a"])
    expect(duplicates.map((photo) => photo.id)).toEqual(["photo-b"])
  })
})
