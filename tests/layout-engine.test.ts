import { describe, expect, test } from "bun:test"

import { CANVAS_PRESETS } from "../src/lib/constants"
import { generateLayout } from "../src/lib/layout-engine"
import type { CollageSettings, Photo } from "../src/types"

function createPhoto(index: number, score: number): Photo {
  const width = 1400 + index * 10
  const height = 1000 + index * 10

  return {
    id: `photo-${index}`,
    file: new File(["image"], `photo-${index}.jpg`, { type: "image/jpeg" }),
    name: `photo-${index}.jpg`,
    previewUrl: "blob:test-photo",
    width,
    height,
    aspectRatio: width / height,
    orientation: "landscape",
    fileSize: 1_000_000 + index,
    score,
  }
}

function createSettings(
  overrides: Partial<CollageSettings> = {}
): CollageSettings {
  return {
    style: "grid",
    canvasPreset: CANVAS_PRESETS[0],
    density: "normal",
    title: "",
    ...overrides,
  }
}

describe("generateLayout", () => {
  test("keeps the top three scored photos in the first three positions", () => {
    const photos = [
      createPhoto(1, 0.25),
      createPhoto(2, 0.95),
      createPhoto(3, 0.5),
      createPhoto(4, 0.8),
      createPhoto(5, 0.1),
    ]

    const layout = generateLayout(photos, createSettings({ style: "grid" }), 42)

    expect(layout.tiles.slice(0, 3).map((tile) => tile.photoId)).toEqual([
      "photo-2",
      "photo-4",
      "photo-3",
    ])
  })

  test("uses the seed to keep scrapbook layouts deterministic", () => {
    const photos = [1, 2, 3, 4, 5, 6].map((index) =>
      createPhoto(index, 1 - index * 0.1)
    )
    const settings = createSettings({ style: "scrapbook" })

    const first = generateLayout(photos, settings, 123)
    const second = generateLayout(photos, settings, 123)
    const third = generateLayout(photos, settings, 124)

    expect(first.tiles).toEqual(second.tiles)
    expect(first.tiles).not.toEqual(third.tiles)
  })

  test("creates full-canvas single-photo magazine layouts", () => {
    const settings = createSettings({
      style: "magazine",
      canvasPreset: CANVAS_PRESETS[2],
    })
    const layout = generateLayout([createPhoto(1, 1)], settings, 7)

    expect(layout.tiles).toHaveLength(1)
    expect(layout.tiles[0]).toMatchObject({
      photoId: "photo-1",
      x: 8,
      y: 8,
      width: settings.canvasPreset.width - 16,
      height: settings.canvasPreset.height - 16,
    })
  })

  test("adds a footer strip for extra photos in magazine layouts", () => {
    const photos = [1, 2, 3, 4, 5].map((index) =>
      createPhoto(index, 1 - index * 0.1)
    )
    const settings = createSettings({
      style: "magazine",
      canvasPreset: CANVAS_PRESETS[1],
    })
    const layout = generateLayout(photos, settings, 99)

    expect(layout.tiles).toHaveLength(5)
    expect(layout.tiles[0].photoId).toBe("photo-1")
    expect(layout.tiles[3].y).toBe(layout.tiles[4].y)
    expect(layout.tiles[3].height).toBe(layout.tiles[4].height)
  })

  test("returns empty tiles when no photos are provided", () => {
    const layout = generateLayout([], createSettings({ style: "grid" }), 1)

    expect(layout.tiles).toEqual([])
    expect(layout.canvasWidth).toBe(CANVAS_PRESETS[0].width)
    expect(layout.canvasHeight).toBe(CANVAS_PRESETS[0].height)
  })
})
