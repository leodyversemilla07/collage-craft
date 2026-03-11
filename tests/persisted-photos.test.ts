import { describe, expect, test } from "bun:test"

import {
  hydratePersistedPhoto,
  serializePhoto,
  type PersistedPhotoRecord,
} from "../src/lib/persisted-photos"
import type { Photo } from "../src/types"

function createPhoto(): Photo {
  const file = new File(["image"], "memory.jpg", { type: "image/jpeg" })

  return {
    id: "photo-1",
    file,
    name: file.name,
    previewUrl: "blob:test",
    width: 1200,
    height: 800,
    aspectRatio: 1.5,
    orientation: "landscape",
    fileSize: file.size,
    score: 0.75,
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
